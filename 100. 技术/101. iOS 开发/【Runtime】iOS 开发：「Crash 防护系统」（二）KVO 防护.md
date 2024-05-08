> 本文是 **「Crash 防护系统」系列** 第二篇。通过本文，您将了解到：
> 1. KVO Crash 的主要原因
> 2. KVO 防止 Crash 的常见方案
> 3. 我的 KVO 防护实现
> 4. 测试 KVO 防护效果
>
> 文中示例代码在： [itcharge](https://github.com/itcharge) / **[YSC-Avoid-Crash](https://github.com/itcharge/YSC-Avoid-Crash)**

<!--more-->

---



![](http://qcdn.itcharge.cn/images/iOS-YSCDefender-02-001.jpg)

---

# 1. KVO Crash 的常见原因

**KVO（Key Value Observing）** 翻译过来就是键值对观察，是 iOS 观察者模式的一种实现。KVO 允许一个对象监听另一个对象特定属性的改变，并在改变时接收到事件。但是 KVO API 的设计，我个人觉得不是很合理。被观察者需要做的工作太多，日常使用时稍不注意就会导致崩溃。

> KVO 日常使用造成崩溃的原因通常有以下几个：
> 1. KVO 添加次数和移除次数不匹配：
>    - 移除了未注册的观察者，导致崩溃。
>    - 重复移除多次，移除次数多于添加次数，导致崩溃。
>    - 重复添加多次，虽然不会崩溃，但是发生改变时，也同时会被观察多次。
> 2. 被观察者提前被释放，被观察者在 dealloc 时仍然注册着 KVO，导致崩溃。
> 例如：被观察者是局部变量的情况（iOS 10 及之前会崩溃）。
> 3. 添加了观察者，但未实现 `observeValueForKeyPath:ofObject:change:context:` 方法，导致崩溃。
> 4. 添加或者移除时 `keypath == nil`，导致崩溃。

---

# 2. KVO 防止 Crash 常见方案

为了避免上面提到的使用 KVO 造成崩溃的问题，于是出现了很多关于 KVO 的第三方库，比如最出名的就是 FaceBook 开源的第三方库 [facebook](https://github.com/facebook) / **[KVOController](https://github.com/facebook/KVOController)**。

FBKVOController 对 KVO 机制进行了额外的一层封装，框架不但可以自动帮我们移除观察者，还提供了 block 或者 selector 的方式供我们进行观察处理。不可否认的是，FBKVOController 为我们的开发提供了很大的便利性。但是相对而言，这种方式对项目代码的侵入性比较大，必须考编码规范来强制约束团队人员使用这种方式。

**那么有没有一种对项目代码侵入性小，同时还能有效防护 KVO 崩溃的防护机制呢？**

网上有很多类似的方案可以参考一下。

> 方案一：[大白健康系统 -- iOS APP 运行时 Crash 自动修复系统](https://neyoufan.github.io/2017/01/13/ios/BayMax_HTSafetyGuard)

1. 首先为 NSObject 建立一个分类，利用 Method Swizzling，实现自定义的 `BMP_addObserver:forKeyPath:options:context:`、`BMP_removeObserver:forKeyPath:`、`BMP_removeObserver:forKeyPath:context:`、`BMPKVO_dealloc` 方法，用来替换系统原生的添加移除观察者方法的实现。
2. 然后在观察者和被观察者之间建立一个 `KVODelegate 对象`，两者之间通过 `KVODelegate 对象` 建立联系。然后在添加和移除操作时，将 KVO 的相关信息例如 `observer`、`keyPath`、`options`、`context` 保存为 `KVOInfo 对象`，并添加到 `KVODelegate 对象` 中对应 的 `关系哈希表` 中，对应原有的添加观察者。
关系哈希表的数据结构：`{keypath : [KVOInfo 对象1, KVOInfo 对象2, ... ]}`
3. 在添加和移除操作的时候，利用  `KVODelegate 对象` 做转发，把真正的观察者变为 `KVODelegate 对象`，而当被观察者的特定属性发生了改变，再由 `KVODelegate 对象` 分发到原有的观察者上。

那么，BayMax 系统是如何避免 KVO 崩溃的呢?

1. **添加观察者时**：通过关系哈希表判断是否重复添加，只添加一次。
2. **移除观察者时**：通过关系哈希表是否已经进行过移除操作，避免多次移除。
3. **观察键值改变时**：同样通过关系哈希表判断，将改变操作分发到原有的观察者上。

 另外，为了避免被观察者提前被释放，被观察者在 dealloc 时仍然注册着 KVO 导致崩溃。BayMax 系统还利用 Method Swizzling 实现了自定义的 dealloc，在系统 dealloc 调用之前，将多余的观察者移除掉。


> 方案二： [ValiantCat](https://github.com/ValiantCat) / **[XXShield](https://github.com/ValiantCat/XXShield)**（第三方框架）

**XXShield** 实现方案和 BayMax 系统类似。也是利用一个 Proxy 对象用来做转发， 真正的观察者是 Proxy，被观察者出现了通知信息，由 Proxy 做分发。不过不同点是 Proxy 里面保存的内容没有前者多。只保存了 `_observed（被观察者）` 和关系哈希表，这个关系哈希表中只维护了 `keyPath` 和 `observer` 的关系。

关系哈希表的数据结构：` {keypath : [observer1, observer2 , ...](NSHashTable)} ` 。

XXShield 在 dealloc 中也做了类似将多余观察者移除掉的操作，是通过关系数据结构和 `_observed` ，然后调用原生移除观察者操作实现的。

> 方案三： [JackLee18](https://github.com/JackLee18) / **[JKCrashProtect](https://github.com/JackLee18/JKCrashProtect)**（第三方框架）

JKCrashProtect 相对于前两个方案来讲，看上去更加的简洁明了。他的不同点在于没有使用 delegate。而是直接在分类中建立了一个关系哈希表，用来保存 ` {keypath : [observer1, observer2 , ...](NSHashTable)} ` 的关系。

添加的时候，如果关系哈希表中与 keyPath 对应的已经有了相关的观察者，就不再进行添加。同样移除观察者的时候，也在哈希表中进行查找，如果存在 observer、keyPath 的信息，就移除掉，否则就不进行移除操作。

不过，这个框架并没有对被观察者在 dealloc 时仍然注册着 KVO ，造成崩溃的情况进行处理。

---

# 3. 我的 KVO 防护实现

参考了这几个方法的实现后，分别实现了一下之后，最终还是选择了 方案一、方案二 这两种方案的实现思路。

1. 我使用了 `YSCKVOProxy 对象`，在 `YSCKVOProxy 对象` 中使用 `{keypath : [observer1, observer2 , ...](NSHashTable)} ` 结构的 `关系哈希表` 进行 `observer`、`keyPath` 之间的维护。
2. 然后利用 `YSCKVOProxy 对象` 对添加、移除、观察方法进行分发处理。
3. 在分类中自定义了 `dealloc` 的实现，移除了多余的观察者。

- 代码如下所示：

```Objc
#import "NSObject+KVODefender.h"
#import "NSObject+MethodSwizzling.h"
#import <objc/runtime.h>

// 判断是否是系统类
static inline BOOL IsSystemClass(Class cls){
    BOOL isSystem = NO;
    NSString *className = NSStringFromClass(cls);
    if ([className hasPrefix:@"NS"] || [className hasPrefix:@"__NS"] || [className hasPrefix:@"OS_xpc"]) {
        isSystem = YES;
        return isSystem;
    }
    NSBundle *mainBundle = [NSBundle bundleForClass:cls];
    if (mainBundle == [NSBundle mainBundle]) {
        isSystem = NO;
    }else{
        isSystem = YES;
    }
    return isSystem;
}


#pragma mark - YSCKVOProxy 相关

@interface YSCKVOProxy : NSObject

// 获取所有被观察的 keyPaths
- (NSArray *)getAllKeyPaths;

@end

@implementation YSCKVOProxy
{
    // 关系数据表结构：{keypath : [observer1, observer2 , ...](NSHashTable)}
    @private
    NSMutableDictionary<NSString *, NSHashTable<NSObject *> *> *_kvoInfoMap;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _kvoInfoMap = [NSMutableDictionary dictionary];
    }
    return self;
}

// 添加 KVO 信息操作, 添加成功返回 YES
- (BOOL)addInfoToMapWithObserver:(NSObject *)observer
                      forKeyPath:(NSString *)keyPath
                         options:(NSKeyValueObservingOptions)options
                         context:(void *)context {
    
    @synchronized (self) {
        if (!observer || !keyPath ||
            ([keyPath isKindOfClass:[NSString class]] && keyPath.length <= 0)) {
            return NO;
        }
        
        NSHashTable<NSObject *> *info = _kvoInfoMap[keyPath];
        if (info.count == 0) {
            info = [[NSHashTable alloc] initWithOptions:(NSPointerFunctionsWeakMemory) capacity:0];
            [info addObject:observer];

            _kvoInfoMap[keyPath] = info;
            
            return YES;
        }
        
        if (![info containsObject:observer]) {
            [info addObject:observer];
        }
        
        return NO;
    }
}

// 移除 KVO 信息操作, 添加成功返回 YES
- (BOOL)removeInfoInMapWithObserver:(NSObject *)observer
                         forKeyPath:(NSString *)keyPath {
    
    @synchronized (self) {
        if (!observer || !keyPath ||
            ([keyPath isKindOfClass:[NSString class]] && keyPath.length <= 0)) {
            return NO;
        }
        
        NSHashTable<NSObject *> *info = _kvoInfoMap[keyPath];
        
        if (info.count == 0) {
            return NO;
        }
        
        [info removeObject:observer];
        
        if (info.count == 0) {
            [_kvoInfoMap removeObjectForKey:keyPath];
            
            return YES;
        }
        
        return NO;
    }
}

// 添加 KVO 信息操作, 添加成功返回 YES
- (BOOL)removeInfoInMapWithObserver:(NSObject *)observer
                         forKeyPath:(NSString *)keyPath
                            context:(void *)context {
    @synchronized (self) {
        if (!observer || !keyPath ||
            ([keyPath isKindOfClass:[NSString class]] && keyPath.length <= 0)) {
            return NO;
        }
    
        NSHashTable<NSObject *> *info = _kvoInfoMap[keyPath];
    
        if (info.count == 0) {
            return NO;
        }
    
        [info removeObject:observer];
    
        if (info.count == 0) {
            [_kvoInfoMap removeObjectForKey:keyPath];
            
            return YES;
        }
    
        return NO;
    }
}

// 实际观察者 yscKVOProxy 进行监听，并分发
- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary<NSKeyValueChangeKey,id> *)change
                       context:(void *)context {

    NSHashTable<NSObject *> *info = _kvoInfoMap[keyPath];
    
    for (NSObject *observer in info) {
        @try {
            [observer observeValueForKeyPath:keyPath ofObject:object change:change context:context];
        } @catch (NSException *exception) {
            NSString *reason = [NSString stringWithFormat:@"KVO Warning : %@",[exception description]];
            NSLog(@"%@",reason);
        }
    }
}

// 获取所有被观察的 keyPaths
- (NSArray *)getAllKeyPaths {
    NSArray <NSString *>*keyPaths = _kvoInfoMap.allKeys;
    return keyPaths;
}

@end


#pragma mark - NSObject+KVODefender 分类

@implementation NSObject (KVODefender)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        
        // 拦截 `addObserver:forKeyPath:options:context:` 方法，替换自定义实现
        [NSObject yscDefenderSwizzlingInstanceMethod: @selector(addObserver:forKeyPath:options:context:)
                                          withMethod: @selector(ysc_addObserver:forKeyPath:options:context:)
                                           withClass: [NSObject class]];
        
        // 拦截 `removeObserver:forKeyPath:` 方法，替换自定义实现
        [NSObject yscDefenderSwizzlingInstanceMethod: @selector(removeObserver:forKeyPath:)
                                          withMethod: @selector(ysc_removeObserver:forKeyPath:)
                                           withClass: [NSObject class]];
        
        // 拦截 `removeObserver:forKeyPath:context:` 方法，替换自定义实现
        [NSObject yscDefenderSwizzlingInstanceMethod: @selector(removeObserver:forKeyPath:context:)
                                          withMethod: @selector(ysc_removeObserver:forKeyPath:context:)
                                           withClass: [NSObject class]];
        
        // 拦截 `dealloc` 方法，替换自定义实现
        [NSObject yscDefenderSwizzlingInstanceMethod: NSSelectorFromString(@"dealloc")
                                          withMethod: @selector(ysc_kvodealloc)
                                           withClass: [NSObject class]];
    });
}

static void *YSCKVOProxyKey = &YSCKVOProxyKey;
static NSString *const KVODefenderValue = @"YSC_KVODefender";
static void *KVODefenderKey = &KVODefenderKey;

// YSCKVOProxy setter 方法
- (void)setYscKVOProxy:(YSCKVOProxy *)yscKVOProxy {
    objc_setAssociatedObject(self, YSCKVOProxyKey, yscKVOProxy, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

// YSCKVOProxy getter 方法
- (YSCKVOProxy *)yscKVOProxy {
    id yscKVOProxy = objc_getAssociatedObject(self, YSCKVOProxyKey);
    if (yscKVOProxy == nil) {
        yscKVOProxy = [[YSCKVOProxy alloc] init];
        self.yscKVOProxy = yscKVOProxy;
    }
    return yscKVOProxy;
}

// 自定义 addObserver:forKeyPath:options:context: 实现方法
- (void)ysc_addObserver:(NSObject *)observer
             forKeyPath:(NSString *)keyPath
                options:(NSKeyValueObservingOptions)options
                context:(void *)context {
    
    if (!IsSystemClass(self.class)) {
        objc_setAssociatedObject(self, KVODefenderKey, KVODefenderValue, OBJC_ASSOCIATION_RETAIN);
        if ([self.yscKVOProxy addInfoToMapWithObserver:observer forKeyPath:keyPath options:options context:context]) {
            // 如果添加 KVO 信息操作成功，则调用系统添加方法
            [self ysc_addObserver:self.yscKVOProxy forKeyPath:keyPath options:options context:context];
        } else {
            // 添加 KVO 信息操作失败：重复添加
            NSString *className = (NSStringFromClass(self.class) == nil) ? @"" : NSStringFromClass(self.class);
            NSString *reason = [NSString stringWithFormat:@"KVO Warning : Repeated additions to the observer:%@ for the key path:'%@' from %@",
                                observer, keyPath, className];
            NSLog(@"%@",reason);
        }
    } else {
        [self ysc_addObserver:observer forKeyPath:keyPath options:options context:context];
    }
}

// 自定义 removeObserver:forKeyPath:context: 实现方法
- (void)ysc_removeObserver:(NSObject *)observer
                forKeyPath:(NSString *)keyPath
                   context:(void *)context {
    
    if (!IsSystemClass(self.class)) {
        if ([self.yscKVOProxy removeInfoInMapWithObserver:observer forKeyPath:keyPath context:context]) {
            // 如果移除 KVO 信息操作成功，则调用系统移除方法
            [self ysc_removeObserver:self.yscKVOProxy forKeyPath:keyPath context:context];
        } else {
            // 移除 KVO 信息操作失败：移除了未注册的观察者
            NSString *className = NSStringFromClass(self.class) == nil ? @"" : NSStringFromClass(self.class);
            NSString *reason = [NSString stringWithFormat:@"KVO Warning : Cannot remove an observer %@ for the key path '%@' from %@ , because it is not registered as an observer", observer, keyPath, className];
            NSLog(@"%@",reason);
        }
    } else {
        [self ysc_removeObserver:observer forKeyPath:keyPath context:context];
    }
}

// 自定义 removeObserver:forKeyPath: 实现方法
- (void)ysc_removeObserver:(NSObject *)observer
                forKeyPath:(NSString *)keyPath {
    
    if (!IsSystemClass(self.class)) {
        if ([self.yscKVOProxy removeInfoInMapWithObserver:observer forKeyPath:keyPath]) {
            // 如果移除 KVO 信息操作成功，则调用系统移除方法
            [self ysc_removeObserver:self.yscKVOProxy forKeyPath:keyPath];
        } else {
            // 移除 KVO 信息操作失败：移除了未注册的观察者
            NSString *className = NSStringFromClass(self.class) == nil ? @"" : NSStringFromClass(self.class);
            NSString *reason = [NSString stringWithFormat:@"KVO Warning : Cannot remove an observer %@ for the key path '%@' from %@ , because it is not registered as an observer", observer, keyPath, className];
            NSLog(@"%@",reason);
        }
    } else {
        [self ysc_removeObserver:observer forKeyPath:keyPath];
    }
    
}

// 自定义 dealloc 实现方法
- (void)ysc_kvodealloc {
    @autoreleasepool {
        if (!IsSystemClass(self.class)) {
            NSString *value = (NSString *)objc_getAssociatedObject(self, KVODefenderKey);
            if ([value isEqualToString:KVODefenderValue]) {
                NSArray *keyPaths =  [self.yscKVOProxy getAllKeyPaths];
                // 被观察者在 dealloc 时仍然注册着 KVO
                if (keyPaths.count > 0) {
                    NSString *reason = [NSString stringWithFormat:@"KVO Warning : An instance %@ was deallocated while key value observers were still registered with it. The Keypaths is:'%@'", self, [keyPaths componentsJoinedByString:@","]];
                    NSLog(@"%@",reason);
                }
                
                // 移除多余的观察者
                for (NSString *keyPath in keyPaths) {
                    [self ysc_removeObserver:self.yscKVOProxy forKeyPath:keyPath];
                }
            }
        }
    }
    
    
    [self ysc_kvodealloc];
}

@end
```

---

# 4. 测试 KVO 防护效果

这里提供一下相关崩溃的测试代码：

```Objc
/********************* KVOCrashObject.h 文件 *********************/
#import <Foundation/Foundation.h>

@interface KVOCrashObject : NSObject

@property (nonatomic, copy) NSString *name;

@end

/********************* KVOCrashObject.m 文件 *********************/
#import "KVOCrashObject.h"

@implementation KVOCrashObject

@end

/********************* ViewController.m 文件 *********************/
#import "ViewController.h"
#import "KVOCrashObject.h"

@interface ViewController ()

@property (nonatomic, strong) KVOCrashObject *objc;

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
    
    self.objc = [[KVOCrashObject alloc] init];
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {

//    1.1 移除了未注册的观察者，导致崩溃
     [self testKVOCrash11];

//    1.2 重复移除多次，移除次数多于添加次数，导致崩溃
//    [self testKVOCrash12];

//    1.3 重复添加多次，虽然不会崩溃，但是发生改变时，也同时会被观察多次。
//    [self testKVOCrash13];

//    2. 被观察者 dealloc 时仍然注册着 KVO，导致崩溃
//    [self testKVOCrash2];

//    3. 观察者没有实现 -observeValueForKeyPath:ofObject:change:context:导致崩溃
//    [self testKVOCrash3];
    
//    4. 添加或者移除时 keypath == nil，导致崩溃。
//    [self testKVOCrash4];
}

/**
 1.1 移除了未注册的观察者，导致崩溃
 */
- (void)testKVOCrash11 {
    // 崩溃日志：Cannot remove an observer XXX for the key path "xxx" from XXX because it is not registered as an observer.
    [self.objc removeObserver:self forKeyPath:@"name"];
}

/**
 1.2 重复移除多次，移除次数多于添加次数，导致崩溃
 */
- (void)testKVOCrash12 {
    // 崩溃日志：Cannot remove an observer XXX for the key path "xxx" from XXX because it is not registered as an observer.
    [self.objc addObserver:self forKeyPath:@"name" options:NSKeyValueObservingOptionNew context:NULL];
    self.objc.name = @"0";
    [self.objc removeObserver:self forKeyPath:@"name"];
    [self.objc removeObserver:self forKeyPath:@"name"];
}

/**
 1.3 重复添加多次，虽然不会崩溃，但是发生改变时，也同时会被观察多次。
 */
- (void)testKVOCrash13 {
    [self.objc addObserver:self forKeyPath:@"name" options:NSKeyValueObservingOptionNew context:NULL];
    [self.objc addObserver:self forKeyPath:@"name" options:NSKeyValueObservingOptionNew context:NULL];
    self.objc.name = @"0";
}

/**
 2. 被观察者 dealloc 时仍然注册着 KVO，导致崩溃
 */
- (void)testKVOCrash2 {
    // 崩溃日志：An instance xxx of class xxx was deallocated while key value observers were still registered with it.
    // iOS 10 及以下会导致崩溃，iOS 11 之后就不会崩溃了
    KVOCrashObject *obj = [[KVOCrashObject alloc] init];
    [obj addObserver: self
          forKeyPath: @"name"
             options: NSKeyValueObservingOptionNew
             context: nil];
}

/**
 3. 观察者没有实现 -observeValueForKeyPath:ofObject:change:context:导致崩溃
 */
- (void)testKVOCrash3 {
    // 崩溃日志：An -observeValueForKeyPath:ofObject:change:context: message was received but not handled.
    KVOCrashObject *obj = [[KVOCrashObject alloc] init];
    
    [self addObserver: obj
           forKeyPath: @"title"
              options: NSKeyValueObservingOptionNew
              context: nil];

    self.title = @"111";
}

/**
 4. 添加或者移除时 keypath == nil，导致崩溃。
 */
- (void)testKVOCrash4 {
    // 崩溃日志： -[__NSCFConstantString characterAtIndex:]: Range or index out of bounds
    KVOCrashObject *obj = [[KVOCrashObject alloc] init];
    
    [self addObserver: obj
           forKeyPath: @""
              options: NSKeyValueObservingOptionNew
              context: nil];
    
//    [self removeObserver:obj forKeyPath:@""];
}


- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary*)change context:(void *)context {

    NSLog(@"object = %@, keyPath = %@", object, keyPath);
}

@end
```

可以将示例项目 `NSObject+KVODefender.m` 中的 `+ (void)load;` 方法注释掉或打开进行防护前后的测试。

经测试可以发现，成功的拦截了这几种因为 KVO 使用不当导致的崩溃。

---

# 参考资料

- [大白健康系统 -- iOS APP 运行时 Crash 自动修复系统](https://neyoufan.github.io/2017/01/13/ios/BayMax_HTSafetyGuard)
- [iOS-APP-运行时防 Crash 工具 XXShield 练就 - 茶茶的小屋](https://www.valiantcat.cn/index.php/2017/11/04/57.html#menu_index_6)
- [iOS 中的 crash 防护（三）KVO 造成的crash](https://blog.csdn.net/hanhailong18/article/details/73034017)
- [iOS KVO crash 自修复技术实现与原理解析](https://yq.aliyun.com/articles/432669?spm=5176.10695662.1996646101.searchclickresult.76b3110eHrDn8B)

