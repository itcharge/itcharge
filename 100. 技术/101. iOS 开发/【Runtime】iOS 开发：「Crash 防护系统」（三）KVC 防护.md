> 本文是 **「Crash 防护系统」系列** 第三篇。通过本文，您将了解到：
> 1. KVC Crash 的主要原因
> 2. KVC 搜索模式
> 3. KVC Crash 防护方案
>
> 文中示例代码在： [itcharge](https://github.com/itcharge) / **[YSC-Avoid-Crash](https://github.com/itcharge/YSC-Avoid-Crash)**

<!--more-->

![](http://qcdn.itcharge.cn/images/iOS-YSCDefender-03-001.jpg)

---

# 1. KVC Crash 的常见原因

**KVC（Key Value Coding）**，即键值编码，提供一种机制来间接访问对象的属性。而不是通过调用 `Setter`、`Getter` 方法进行访问。

> KVC 日常使用造成崩溃的原因通常有以下几个：
> 1. key 不是对象的属性，造成崩溃。
> 2. keyPath 不正确，造成崩溃。
> 3. key 为 nil，造成崩溃。
> 4. value 为 nil，为非对象设值，造成崩溃。

常见的使用 KVC 造成崩溃代码：

```Objc
/********************* KVCCrashObject.h 文件 *********************/
#import <Foundation/Foundation.h>

@interface KVCCrashObject : NSObject

@property (nonatomic, copy) NSString *name;

@property (nonatomic, assign) NSInteger age;

@end

/********************* KVCCrashObject.m 文件 *********************/
#import "KVCCrashObject.h"

@implementation KVCCrashObject

@end


/********************* ViewController.m 文件 *********************/
#import "ViewController.h"
#import "KVCCrashObject.h"

@interface ViewController ()

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
 
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {    
//    1. key 不是对象的属性，造成崩溃
//    [self testKVCCrash1];

//    2. keyPath 不正确，造成崩溃
//    [self testKVCCrash2];

//    3. key 为 nil，造成崩溃
//    [self testKVCCrash4];

//    4. value 为 nil，为非对象设值，造成崩溃
//    [self testKVCCrash4];
}

/**
 1. key 不是对象的属性，造成崩溃
 */
- (void)testKVCCrash1 {
    // 崩溃日志：[<KVCCrashObject 0x600000d48ee0> setValue:forUndefinedKey:]: this class is not key value coding-compliant for the key XXX.;
    
    KVCCrashObject *objc = [[KVCCrashObject alloc] init];
    [objc setValue:@"value" forKey:@"address"];
}

/**
 2. keyPath 不正确，造成崩溃
 */
- (void)testKVCCrash2 {
    // 崩溃日志：[<KVCCrashObject 0x60000289afb0> valueForUndefinedKey:]: this class is not key value coding-compliant for the key XXX.
    
    KVCCrashObject *objc = [[KVCCrashObject alloc] init];
    [objc setValue:@"后厂村路" forKeyPath:@"address.street"];
}

/**
 3. key 为 nil，造成崩溃
 */
- (void)testKVCCrash3 {
    // 崩溃日志：'-[KVCCrashObject setValue:forKey:]: attempt to set a value for a nil key

    NSString *keyName;
    // key 为 nil 会崩溃，如果传 nil 会提示警告，传空变量则不会提示警告
    
    KVCCrashObject *objc = [[KVCCrashObject alloc] init];
    [objc setValue:@"value" forKey:keyName];
}

/**
 4. value 为 nil，造成崩溃
 */
- (void)testKVCCrash4 {
    // 崩溃日志：[<KVCCrashObject 0x6000028a6780> setNilValueForKey]: could not set nil as the value for the key XXX.
    
    // value 为 nil 会崩溃
    KVCCrashObject *objc = [[KVCCrashObject alloc] init];
    [objc setValue:nil forKey:@"age"];
}

@end
```

**那么如何来解决这种崩溃问题呢？**

首先我们需要先来了解下 KVC 在执行时，具体的搜索模式。也就是 KVC 内部的执行流程。根据了解了 KVC 内部的具体执行流程，我们才能知道在哪个步骤对其进行防护。

---

# 2. KVC 搜索模式

## 2.1 KVC Setter 搜索模式

系统在执行 `setValue:forKey:` 方法时，会把 `key` 和 `value` 作为输入参数，并尝试在接收调用对象的内部，给属性 `key` 设置 `value` 值。通过以下几个步骤：
1. 按顺序查找名为 `set<Key>:`、`_set<Key>:` 、`setIs<Key>:` 方法。如果找到方法，则执行该方法，使用输入参数设置变量，则 `setValue:forKey:` 完成执行。如果没找到方法，则执行下一步。
2. 访问类的 `accessInstanceVariablesDirectly` 属性。如果 `accessInstanceVariablesDirectly` 属性返回 `YES`，就按顺序查找名为 `_<key>`、`_is<Key>`、`<key>`、`is<Key>` 的实例变量，如果找到了对应的实例变量，则使用输入参数设置变量。则  `setValue:forKey:` 完成执行。如果未找到对应的实例变量，或者 `accessInstanceVariablesDirectly` 属性返回 `NO` 则执行下一步。
3. 调用 `setValue: forUndefinedKey:` 方法，并引发崩溃。


下边我们通过图示来展示一下这个流程。

- 相关代码：

```
KVCCrashObject *objc = [[KVCCrashObject alloc] init];
[objc setValue:@"value" forKey:@"name"];
```

- KVC `setValue:forKey:` 搜索模式流程图：

![](http://qcdn.itcharge.cn/images/iOS-YSCDefender-03-002.png)

---

## 2.2 KVC Getter 搜索模式

系统在执行 `valueForKey:` 方法时，会将给定的 `key` 作为输入参数，在调用对象的内部进行以下几个步骤：
1. 按顺序查找名为 `get<Key>`、`<key>`、`is<Key>`、`_<key>` 的访问方法。如果找到，调用该方法，并继续执行步骤 5。否则继续向下执行步骤 2。
2. 搜索形如 `countOf<Key>`、`objectIn<Key>AtIndex:`、`<key>AtIndexes:` 的方法。
    - 如果实现了  `countOf<Key>` 方法，并且实现了 `objectIn<Key>AtIndex:` 和 `<key>AtIndexes:` 这两个方法的任意一个方法，系统就会以 NSArray 为父类，动态生成一个类型为 NSKeyValueArray 的集合类对象，并调用上边的实现方法，将结果直接返回。
    - 如果对象还实现了形如 `get<Key>:range:` 的方法，系统也会在必要的时候自动调用。
    - 如果上述操作不成功则继续向下执行步骤 3。
3. 如果上边两步失败，系统就会查找形如 `countOf<Key>`、`enumeratorOf<Key>`、`memberOf<Key>:` 的方法。系统会自动生成一个 NSSet 类型的集合类对象，该对象响应所有 NSSet 方法并将结果返回。如果查找失败，则执行步骤 4。
4. 如果上边三步失败，系统就会访问类的 `accessInstanceVariablesDirectly` 方法。
    - 如果返回 `YES`，就按顺序查找名为 `_<key>`、`_is<Key>`、`<key>`、`is<Key>` 的实例变量。如果找到了对应的实例变量，则直接获取实例变量的值。并继续执行步骤 5。            
    - 如果返回 `NO`，或者未找到对应的实例变量，则继续执行步骤 6。
5. 分为三种情况：
    - 如果检索到的属性值是对象指针，则直接返回结果。
    - 如果检索到的属性值是 `NSNumber` 支持的基础数据类型，则将其存储在 `NSNumber` 实例中并返回该值。
    - 如果检索到的属性值是 `NSNumber` 不支持的数据类型，则转换为 `NSValue` 对象并返回该对象。
6. 如果一切都失败了，调用 `valueForUndefinedKey:`，并引发崩溃。

---

# 3. KVC Crash 防护方案

- 从 2.1 KVC Setter 搜索模式 和 2.2 KVC Getter 搜索模式 可以看出：
    - `setValue:forKey:` 执行失败会调用 `setValue: forUndefinedKey:` 方法，并引发崩溃。
    - `valueForKey:` 执行失败会调用 `valueForUndefinedKey:` 方法，并引发崩溃。

所以，为了进行 KVC Crash 防护，我们就需要重写  `setValue: forUndefinedKey:` 方法和 `valueForUndefinedKey:` 方法。重写这两个方法之后，就可以防护 **1. key 不是对象的属性** 和 **2. keyPath 不正确** 这两种崩溃情况了。

那么 **3. key 为 nil，造成崩溃** 的情况，该怎么防护呢？**

我们可以利用 Method Swizzling 方法，在 NSObject 的分类中将 `setValue:forKey:` 和 `ysc_setValue:forKey:` 进行方法交换。然后在自定义的方法中，添加对 key 为 nil 这种类型的判断。

> **注意**：这里我看到另外一个开发者不是很建议 Hook 掉系统的 `setValue:forKey:` 方法，说是为了尽可能少的对系统方法产生逻辑判断。这里我也持保留意见。小伙伴可以亲自试验一下。
> 作者文章链接：[iOS 中的 crash 防护（二）KVC 造成的 crash](https://blog.csdn.net/hanhailong18/article/details/71182878)

还有最后一种 **4. value 为 nil，为非对象设值，造成崩溃** 的情况。

在 `NSKeyValueCoding.h` 文件中，有一个 `setNilValueForKey:` 方法。上边的官方注释给了我们答案。

在调用 `setValue:forKey:` 方法时，系统如果查找到名为 `set<Key>:` 方法的时候，会去检测 value 的参数类型，如果参数类型为 NSNmber 的标量类型或者是 NSValue 的结构类型，但是 value 为 nil 时，会自动调用 `setNilValueForKey:` 方法。这个方法的默认实现会引发崩溃。

所以为了防止这种情况导致的崩溃，我们可以通过重写 `setNilValueForKey:` 来解决。

至此，上文提到的 KVC 使用不当造成的四种类型崩溃就都解决了。下面我们来看下具体实现代码。

- 具体防护代码：

```Objc
/********************* NSObject+KVCDefender.h 文件 *********************/
#import <Foundation/Foundation.h>

@interface NSObject (KVCDefender)

@end

/********************* NSObject+KVCDefender.m 文件 *********************/
#import "NSObject+KVCDefender.h"
#import "NSObject+MethodSwizzling.h"

@implementation NSObject (KVCDefender)

// 不建议拦截 `setValue:forKey:` 方法
+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{

        // 拦截 `setValue:forKey:` 方法，替换自定义实现
        [NSObject yscDefenderSwizzlingInstanceMethod:@selector(setValue:forKey:)
                                       withMethod:@selector(ysc_setValue:forKey:)
                                        withClass:[NSObject class]];

    });
}

- (void)ysc_setValue:(id)value forKey:(NSString *)key {
    if (key == nil) {
        NSString *crashMessages = [NSString stringWithFormat:@"crashMessages : [<%@ %p> setNilValueForKey]: could not set nil as the value for the key %@.",NSStringFromClass([self class]),self,key];
        NSLog(@"%@", crashMessages);
        return;
    }

    [self ysc_setValue:value forKey:key];
}

- (void)setNilValueForKey:(NSString *)key {
    NSString *crashMessages = [NSString stringWithFormat:@"crashMessages : [<%@ %p> setNilValueForKey]: could not set nil as the value for the key %@.",NSStringFromClass([self class]),self,key];
    NSLog(@"%@", crashMessages);
}

- (void)setValue:(id)value forUndefinedKey:(NSString *)key {
    NSString *crashMessages = [NSString stringWithFormat:@"crashMessages : [<%@ %p> setValue:forUndefinedKey:]: this class is not key value coding-compliant for the key: %@,value:%@'",NSStringFromClass([self class]),self,key,value];
    NSLog(@"%@", crashMessages);
}

- (nullable id)valueForUndefinedKey:(NSString *)key {
    NSString *crashMessages = [NSString stringWithFormat:@"crashMessages :[<%@ %p> valueForUndefinedKey:]: this class is not key value coding-compliant for the key: %@",NSStringFromClass([self class]),self,key];
    NSLog(@"%@", crashMessages);
    
    return self;
}

@end
```

经过测试，刚才因为使用 KVC 不当造成崩溃都已经被解决了。

---

# 参考资料

- [苹果官方：键值编码编程指南](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/KeyValueCoding/index.html)
- [dandelionYD：KVC(二)](https://www.jianshu.com/p/84dd0c49c7b5)
- [iOS 中的 crash 防护（二）KVC 造成的 crash](https://blog.csdn.net/hanhailong18/article/details/71182878)
