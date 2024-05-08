> 本文用来介绍 iOS 开发中「Runtime」中的黑魔法 **Method Swizzling**。通过本文，您将了解到：
>
> 1. Method Swizzling（动态方法交换）简介
> 2. Method Swizzling 使用方法（四种方案）
> 3. Method Swizzling 使用注意
> 4. Method Swizzling 应用场景
>    4.1 全局页面统计功能
>    4.2 字体根据屏幕尺寸适配
>    4.3 处理按钮重复点击
>    4.4 TableView、CollectionView 异常加载占位图
>    4.5 APM（应用性能管理）、防止崩溃
>
> 文中示例代码在： [itcharge](https://github.com/itcharge) / **[YSC-Runtime-MethodSwizzling](https://github.com/itcharge/YSC-Runtime-MethodSwizzling)**

<!--more-->

---

![](http://qcdn.itcharge.cn/images/iOS-Runtime-02-001.png)

我们在上一篇 [iOS 开发：「Runtime」详解（一）基础知识](https://tcharge.net/blog/iOS-Runtime-01.html) 中，讲解了 iOS 运行时机制（Runtime 系统）的工作原理。包括消息发送以及转发机制的原理和流程。

从这一篇文章开始，我们来了解一下 Runtime 在实际开发过程中，具体的应用场景。

这一篇我们来学习一下被称为 Runtime 运行时系统中最具争议的黑魔法：**Method Swizzling（动态方法交换）**

---

# 1. Method Swizzling（动态方法交换）简介

**Method Swizzling** 用于改变一个已经存在的 selector 实现。我们可以在程序运行时，通过改变 selector 所在 Class（类）的 method list（方法列表）的映射从而改变方法的调用。其实质就是交换两个方法的 IMP（方法实现）。

上一篇文章中我们知道：`Method（方法）`对应的是 `objc_method 结构体`；而 `objc_method 结构体` 中包含了 `SEL method_name（方法名）`、`IMP method_imp（方法实现）`。

```
// objc_method 结构体
typedef struct objc_method *Method;

struct objc_method {
    SEL _Nonnull method_name;                    // 方法名
    char * _Nullable method_types;               // 方法类型
    IMP _Nonnull method_imp;                     // 方法实现
};
```

`Method（方法）`、`SEL（方法名）`、`IMP（方法实现）`三者的关系可以这样来表示：

在运行时，`Class（类）` 维护了一个 `method list（方法列表）` 来确定消息的正确发送。`method list（方法列表）` 存放的元素就是 `Method（方法）`。而 `Method（方法）` 中映射了一对键值对：`SEL（方法名）：IMP（方法实现）`。

Method swizzling 修改了 method list（方法列表），使得不同 `Method（方法）`中的键值对发生了交换。比如交换前两个键值对分别为 `SEL A : IMP A`、`SEL B : IMP B`，交换之后就变为了 `SEL A : IMP B`、`SEL B : IMP A`。如图所示：

![](http://qcdn.itcharge.cn/images/iOS-Runtime-02-002.png)

# 2. Method Swizzling 使用方法

假如当前类中有两个方法：`- (void)originalFunction;` 和 `- (void)swizzledFunction;`。如果我们想要交换两个方法的实现，从而实现调用 `- (void)originalFunction;` 方法实际上调用的是 `- (void)swizzledFunction;` 方法，而调用 `- (void)swizzledFunction;` 方法实际上调用的是 `- (void)originalFunction;` 方法的效果。那么我们需要像下边代码一样来实现。

## 2.1 Method Swizzling 简单使用

在当前类的 `+ (void)load;` 方法中增加 Method Swizzling 操作，交换 `- (void)originalFunction;` 和 `- (void)swizzledFunction;` 的方法实现。

```
#import "ViewController.h"
#import <objc/runtime.h>

@interface ViewController ()

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    [self SwizzlingMethod];
    [self originalFunction];
    [self swizzledFunction];
}


// 交换 原方法 和 替换方法 的方法实现
- (void)SwizzlingMethod {
    // 当前类
    Class class = [self class];

    // 原方法名 和 替换方法名
    SEL originalSelector = @selector(originalFunction);
    SEL swizzledSelector = @selector(swizzledFunction);

    // 原方法结构体 和 替换方法结构体
    Method originalMethod = class_getInstanceMethod(class, originalSelector);
    Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);

    // 调用交换两个方法的实现
    method_exchangeImplementations(originalMethod, swizzledMethod);
}

// 原始方法
- (void)originalFunction {
    NSLog(@"originalFunction");
}

// 替换方法
- (void)swizzledFunction {
    NSLog(@"swizzledFunction");
}

@end
```

> 打印结果：
> 2019-07-12 09:59:19.672349+0800 Runtime-MethodSwizzling[91009:30112833] swizzledFunction
> 2019-07-12 09:59:20.414930+0800 Runtime-MethodSwizzling[91009:30112833] originalFunction

可以看出两者方法成功进行了交换。

---

刚才我们简单演示了如何在当前类中如何进行 Method Swizzling 操作。但一般日常开发中，并不是直接在原有类中进行 Method Swizzling 操作。更多的是为当前类添加一个分类，然后在分类中进行 Method Swizzling 操作。另外真正使用会比上边写的考虑东西要多一点，要复杂一些。

在日常使用 Method Swizzling 的过程中，有几种很常用的方案，具体情况如下。

## 2.1 Method Swizzling 方案 A

> 在该类的分类中添加 Method Swizzling 交换方法，用普通方式

这种方式在开发中应用最多的。但是还是要注意一些事项，我会在接下来的 **3. Method Swizzling 使用注意** 进行详细说明。

```objc
@implementation UIViewController (Swizzling)

// 交换 原方法 和 替换方法 的方法实现
+ (void)load {

    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        // 当前类
        Class class = [self class];

        // 原方法名 和 替换方法名
        SEL originalSelector = @selector(originalFunction);
        SEL swizzledSelector = @selector(swizzledFunction);

        // 原方法结构体 和 替换方法结构体
        Method originalMethod = class_getInstanceMethod(class, originalSelector);
        Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);

        /* 如果当前类没有 原方法的 IMP，说明在从父类继承过来的方法实现，
         * 需要在当前类中添加一个 originalSelector 方法，
         * 但是用 替换方法 swizzledMethod 去实现它
         */
        BOOL didAddMethod = class_addMethod(class,
                                            originalSelector,
                                            method_getImplementation(swizzledMethod),
                                            method_getTypeEncoding(swizzledMethod));

        if (didAddMethod) {
            // 原方法的 IMP 添加成功后，修改 替换方法的 IMP 为 原始方法的 IMP
            class_replaceMethod(class,
                                swizzledSelector,
                                method_getImplementation(originalMethod),
                                method_getTypeEncoding(originalMethod));
        } else {
            // 添加失败（说明已包含原方法的 IMP），调用交换两个方法的实现
            method_exchangeImplementations(originalMethod, swizzledMethod);
        }
    });
}

// 原始方法
- (void)originalFunction {
    NSLog(@"originalFunction");
}

// 替换方法
- (void)swizzledFunction {
    NSLog(@"swizzledFunction");
}

@end
```

## 2.2 Method Swizzling 方案 B

> 在该类的分类中添加 Method Swizzling 交换方法，但是使用函数指针的方式。

方案 B 和方案 A 的最大不同之处在于使用了函数指针的方式，使用函数指针最大的好处是可以有效避免命名错误。

```objc
#import "UIViewController+PointerSwizzling.h"
#import <objc/runtime.h>

typedef IMP *IMPPointer;

// 交换方法函数
static void MethodSwizzle(id self, SEL _cmd, id arg1);
// 原始方法函数指针
static void (*MethodOriginal)(id self, SEL _cmd, id arg1);

// 交换方法函数
static void MethodSwizzle(id self, SEL _cmd, id arg1) {

    // 在这里添加 交换方法的相关代码
    NSLog(@"swizzledFunc");

    MethodOriginal(self, _cmd, arg1);
}

BOOL class_swizzleMethodAndStore(Class class, SEL original, IMP replacement, IMPPointer store) {
    IMP imp = NULL;
    Method method = class_getInstanceMethod(class, original);
    if (method) {
        const char *type = method_getTypeEncoding(method);
        imp = class_replaceMethod(class, original, replacement, type);
        if (!imp) {
            imp = method_getImplementation(method);
        }
    }
    if (imp && store) { *store = imp; }
    return (imp != NULL);
}

@implementation UIViewController (PointerSwizzling)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        [self swizzle:@selector(originalFunc) with:(IMP)MethodSwizzle store:(IMP *)&MethodOriginal];
    });
}

+ (BOOL)swizzle:(SEL)original with:(IMP)replacement store:(IMPPointer)store {
    return class_swizzleMethodAndStore(self, original, replacement, store);
}

// 原始方法
- (void)originalFunc {
    NSLog(@"originalFunc");
}

@end
```

## 2.3 Method Swizzling 方案 C

> 在其他类中添加 Method Swizzling 交换方法

这种情况一般用的不多，最出名的就是 AFNetworking 中的\_AFURLSessionTaskSwizzling 私有类。\_AFURLSessionTaskSwizzling 主要解决了 iOS7 和 iOS8 系统上 NSURLSession 差别的处理。让不同系统版本 NSURLSession 版本基本一致。

```objc
static inline void af_swizzleSelector(Class theClass, SEL originalSelector, SEL swizzledSelector) {
    Method originalMethod = class_getInstanceMethod(theClass, originalSelector);
    Method swizzledMethod = class_getInstanceMethod(theClass, swizzledSelector);
    method_exchangeImplementations(originalMethod, swizzledMethod);
}

static inline BOOL af_addMethod(Class theClass, SEL selector, Method method) {
    return class_addMethod(theClass, selector,  method_getImplementation(method),  method_getTypeEncoding(method));
}

@interface _AFURLSessionTaskSwizzling : NSObject

@end

@implementation _AFURLSessionTaskSwizzling

+ (void)load {
    if (NSClassFromString(@"NSURLSessionTask")) {

        NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration ephemeralSessionConfiguration];
        NSURLSession * session = [NSURLSession sessionWithConfiguration:configuration];
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wnonnull"
        NSURLSessionDataTask *localDataTask = [session dataTaskWithURL:nil];
#pragma clang diagnostic pop
        IMP originalAFResumeIMP = method_getImplementation(class_getInstanceMethod([self class], @selector(af_resume)));
        Class currentClass = [localDataTask class];

        while (class_getInstanceMethod(currentClass, @selector(resume))) {
            Class superClass = [currentClass superclass];
            IMP classResumeIMP = method_getImplementation(class_getInstanceMethod(currentClass, @selector(resume)));
            IMP superclassResumeIMP = method_getImplementation(class_getInstanceMethod(superClass, @selector(resume)));
            if (classResumeIMP != superclassResumeIMP &&
                originalAFResumeIMP != classResumeIMP) {
                [self swizzleResumeAndSuspendMethodForClass:currentClass];
            }
            currentClass = [currentClass superclass];
        }

        [localDataTask cancel];
        [session finishTasksAndInvalidate];
    }
}

+ (void)swizzleResumeAndSuspendMethodForClass:(Class)theClass {
    Method afResumeMethod = class_getInstanceMethod(self, @selector(af_resume));
    Method afSuspendMethod = class_getInstanceMethod(self, @selector(af_suspend));

    if (af_addMethod(theClass, @selector(af_resume), afResumeMethod)) {
        af_swizzleSelector(theClass, @selector(resume), @selector(af_resume));
    }

    if (af_addMethod(theClass, @selector(af_suspend), afSuspendMethod)) {
        af_swizzleSelector(theClass, @selector(suspend), @selector(af_suspend));
    }
}

- (void)af_resume {
    NSAssert([self respondsToSelector:@selector(state)], @"Does not respond to state");
    NSURLSessionTaskState state = [self state];
    [self af_resume];

    if (state != NSURLSessionTaskStateRunning) {
        [[NSNotificationCenter defaultCenter] postNotificationName:AFNSURLSessionTaskDidResumeNotification object:self];
    }
}

- (void)af_suspend {
    NSAssert([self respondsToSelector:@selector(state)], @"Does not respond to state");
    NSURLSessionTaskState state = [self state];
    [self af_suspend];

    if (state != NSURLSessionTaskStateSuspended) {
        [[NSNotificationCenter defaultCenter] postNotificationName:AFNSURLSessionTaskDidSuspendNotification object:self];
    }
}
```

## 2.4 Method Swizzling 方案 D

> 优秀的第三方框架：[JRSwizzle](https://link.jianshu.com/?t=https://github.com/rentzsch/jrswizzle) 和 [RSSwizzle](https://link.jianshu.com/?t=https://github.com/rabovik/RSSwizzle)

JRSwizzle 和 RSSwizzle 都是优秀的封装 Method Swizzling 的第三方框架。

1. **JRSwizzle** 尝试解决在不同平台和系统版本上的 Method Swizzling 与类继承关系的冲突。对各平台低版本系统兼容性较强。JRSwizzle 核心是用到了 `method_exchangeImplementations` 方法。在健壮性上先做了 `class_addMethod` 操作。

2. **RSSwizzle** 主要用到了 `class_replaceMethod` 方法，避免了子类的替换影响了父类。而且对交换方法过程加了锁，增强了线程安全。它用很复杂的方式解决了 **[What are the dangers of method swizzling in Objective-C？](https://stackoverflow.com/questions/5339276/what-are-the-dangers-of-method-swizzling-in-objective-c)** 中提到的问题。是一种更安全优雅的 Method Swizzling 解决方案。

---

### 总结：

在开发中我们通常使用方案 A，或者方案 D 中的第三方框架 RSSwizzle 来实现 Method Swizzling。在接下来 **3. Method Swizzling** 使用注意 中，我们还讲看到很多的注意事项。这些注意事项并不是为了吓退初学者，而是为了更好的使用 Method Swizzling 这一利器。而至于方案的选择，无论是选择哪种方案，我认为只有最适合项目的方案才是最佳方案。

---

# 3. Method Swizzling 使用注意

Method Swizzling 之所以被大家称为黑魔法，就是因为使用 Method Swizzling 进行方法交换是一个危险的操作。Stack Overflow 上边有人提出了使用 Method Swizzling 会造成的一些危险和缺陷。更是把 Method Swizzling 比作是厨房里一把锋利的刀。有些人会害怕刀过于锋利，会伤到自己，从而放弃了刀，或者使用了钝刀。但是事实却是：**锋利的刀比钝刀反而更加安全，前提是你有足够的经验。**

Method Swizzling 可用于编写更好，更高效，更易维护的代码。但也可能因为被滥用而导致可怕的错误。所以在使用 Method Swizzling 的时候，我们还是要注意一些事项，以规避可能出现的危险。

- Stack Overflow 相关问题链接：[What are the dangers of method swizzling in Objective-C ？](https://stackoverflow.com/questions/5339276/what-are-the-dangers-of-method-swizzling-in-objective-c)

下面我们结合还有其他博主关于 Method Swizzling 的博文、 以及 Stack Overflow 上边提到的危险和缺陷，还有笔者的个人见解，来综合说一下使用 Method Swizzling 需要注意的地方。

> 1. 应该只在 `+load` 中执行 Method Swizzling。

程序在启动的时候，会先加载所有的类，这时会调用每个类的 `+load` 方法。而且在整个程序运行周期只会调用一次（不包括外部显示调用)。所以在 `+load` 方法进行 Method Swizzling 再好不过了。

而为什么不用 `+initialize` 方法呢。

因为 `+initialize` 方法的调用时机是在 第一次向该类发送第一个消息的时候才会被调用。如果该类只是引用，没有调用，则不会执行 `+initialize` 方法。
Method Swizzling 影响的是全局状态，`+load` 方法能保证在加载类的时候就进行交换，保证交换结果。而使用 `+initialize` 方法则不能保证这一点，有可能在使用的时候起不到交换方法的作用。

> 2. Method Swizzling 在 `+load` 中执行时，不要调用 `[super load];`。

上边我们说了，程序在启动的时候，会先加载所有的类。如果在 `+ (void)load`方法中调用 `[super load]` 方法，就会导致父类的 `Method Swizzling` 被重复执行两次，而方法交换也被执行了两次，相当于互换了一次方法之后，第二次又换回去了，从而使得父类的 `Method Swizzling` 失效。

> 3. Method Swizzling 应该总是在 `dispatch_once` 中执行。

Method Swizzling 不是原子操作，`dispatch_once` 可以保证即使在不同的线程中也能确保代码只执行一次。所以，我们应该总是在 `dispatch_once` 中执行 Method Swizzling 操作，保证方法替换只被执行一次。

> 4. 使用 Method Swizzling 后要记得调用原生方法的实现。

在交换方法实现后记得要调用原生方法的实现（除非你非常确定可以不用调用原生方法的实现）：APIs 提供了输入输出的规则，而在输入输出中间的方法实现就是一个看不见的黑盒。交换了方法实现并且一些回调方法不会调用原生方法的实现这可能会造成底层实现的崩溃。

> 5. 避免命名冲突和参数 `_cmd` 被篡改。

1. 避免命名冲突一个比较好的做法是为替换的方法加个前缀以区别原生方法。一定要确保调用了原生方法的所有地方不会因为自己交换了方法的实现而出现意料不到的结果。
   在使用 Method Swizzling 交换方法后记得要在交换方法中调用原生方法的实现。在交换了方法后并且不调用原生方法的实现可能会造成底层实现的崩溃。

2. 避免方法命名冲突另一个更好的做法是使用函数指针，也就是上边提到的 **方案 B**，这种方案能有效避免方法命名冲突和参数 `_cmd` 被篡改。

> 6. 谨慎对待 Method Swizzling。

使用 Method Swizzling，会改变非自己拥有的代码。我们使用 Method Swizzling 通常会更改一些系统框架的对象方法，或是类方法。我们改变的不只是一个对象实例，而是改变了项目中所有的该类的对象实例，以及所有子类的对象实例。所以，在使用 Method Swizzling 的时候，应该保持足够的谨慎。

例如，你在一个类中重写一个方法，并且不调用 super 方法，则可能会出现问题。在大多数情况下，super 方法是期望被调用的（除非有特殊说明）。如果你是用同样的思想来进行 Method Swizzling ，可能就会引起很多问题。如果你不调用原始的方法实现，那么你 Method Swizzling 改变的越多代码就越不安全。

> 7. 对于 Method Swizzling 来说，**调用顺序** 很重要。

`+ load` 方法的调用规则为：

1. 先调用主类，按照编译顺序，顺序地根据继承关系由父类向子类调用；
2. 再调用分类，按照编译顺序，依次调用；
3. `+ load` 方法除非主动调用，否则只会调用一次。

这样的调用规则导致了 `+ load` 方法调用顺序并不一定确定。一个顺序可能是：`父类 -> 子类 -> 父类类别 -> 子类类别`，也可能是 `父类 -> 子类 -> 子类类别 -> 父类类别`。所以 Method Swizzling 的顺序不能保证，那么就不能保证 Method Swizzling 后方法的调用顺序是正确的。

所以被用于 Method Swizzling 的方法必须是当前类自身的方法，如果把继承父类来的 IMP 复制到自身上面可能会存在问题。如果 `+ load` 方法调用顺序为：`父类 -> 子类 -> 父类类别 -> 子类类别`，那么造成的影响就是调用子类的替换方法并不能正确调起父类分类的替换方法。原因解释可以参考这篇文章：[南栀倾寒：iOS 界的毒瘤-MethodSwizzling](https://www.jianshu.com/p/19c5736c5d9a)

关于调用顺序更细致的研究可以参考这篇博文：[玉令天下的博客：Objective-C Method Swizzling](http://yulingtianxia.com/blog/2017/04/17/Objective-C-Method-Swizzling/)

---

# 4. Method Swizzling 应用场景

Method Swizzling 可以交换两个方法的实现，在开发中更多的是应用于系统类库，以及第三方框架的方法替换。在官方不公开源码的情况下，我们可以借助 Runtime 的 Method Swizzling 为原有方法添加额外的功能，这使得我们可以做很多有趣的事情。

---

## 4.1 全局页面统计功能

> 需求：在所有页面添加统计功能，用户每进入一次页面就统计一次。

如果有一天公司产品需要我们来实现这个需求。我们应该如何来实现？

先来思考一下有几种实现方式：

> 第一种：手动添加

直接在所有页面添加一次统计代码。你需要做的是写一份统计代码，然后在所有页面的 `viewWillAppear:` 中不停的进行复制、粘贴。

> 第二种：利用继承

创建基类，所有页面都继承自基类。这样的话只需要在基类的 `viewDidAppear:` 中添加一次统计功能。这样修改代码还是很多，如果所有页面不是一开始继承自定义的基类，那么就需要把所有页面的继承关系修改一下，同样会造成很多重复代码，和极大的工作量。

> 第三种：利用分类 + Method Swizzling

我们可以利用 Category 的特性来实现这个功能。**如果一个类的分类重写了这个类的方法之后，那么该类的方法将会失效，起作用的将会是分类中重写的方法。**

这样的话，我们可以为 UIViewController 建立一个 Category，在分类中重写 `viewWillAppear:`，在其中添加统计代码，然后在所有的控制器中引入这个 Category。但是这样的话，所有继承自 UIViewController 类自身的 `viewWillAppear:` 就失效了，不会被调用。

这就需要用 **Method Swizzling** 来实现了。步骤如下：

1. 在分类中实现一个自定义的`xxx_viewWillAppear:` 方法；
2. 利用 Method Swizzling 将 `viewDidAppear:` 和自定义的 `xxx_viewWillAppear:` 进行方法交换。
3. 然后在 `xxx_viewWillAppear:` 中添加统计代码和调用`xxx_viewWillAppear:`实现；
   因为两个方法发生了交换，所以最后实质是调用了 `viewWillAppear:` 方法。

- 代码实现：

```
#import "UIViewController+Swizzling.h"
#import <objc/runtime.h>

@implementation UIViewController (Swizzling)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class class = [self class];

        SEL originalSelector = @selector(viewWillAppear:);
        SEL swizzledSelector = @selector(xxx_viewWillAppear:);

        Method originalMethod = class_getInstanceMethod(class, originalSelector);
        Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);

        BOOL didAddMethod = class_addMethod(class,
                                            originalSelector,
                                            method_getImplementation(swizzledMethod),
                                            method_getTypeEncoding(swizzledMethod));

        if (didAddMethod) {
            class_replaceMethod(class,
                                swizzledSelector,
                                method_getImplementation(originalMethod),
                                method_getTypeEncoding(originalMethod));
        } else {
            method_exchangeImplementations(originalMethod, swizzledMethod);
        }
    });
}

#pragma mark - Method Swizzling

- (void)xxx_viewWillAppear:(BOOL)animated {

    if (![self isKindOfClass:[UIViewController class]]) {  // 剔除系统 UIViewController
        // 添加统计代码
        NSLog(@"进入页面：%@", [self class]);
    }

    [self xxx_viewWillAppear:animated];
}

@end
```

---

## 4.2 字体根据屏幕尺寸适配

> 需求：所有的控件字体必须依据屏幕的尺寸等比缩放。

照例，我们先来想想几种实现方式。

> 第一种：手动修改

所有用到的 UIFont 的地方，手动判断，添加适配代码。一想到那个工作量，不忍直视。

> 第二种：利用宏定义

在 PCH 文件定义一个计算缩放字体的方法。在使用设置字体时，先调用宏定义的缩放字体的方法。但是这样同样需要修改所有用到的 UIFont 的地方。工作量依旧很大。

```
//宏定义
#define UISCREEN_WIDTH ([UIScreen mainScreen].bounds.size.width)

/**
 *  计算缩放字体的方法
 */
static inline CGFloat FontSize(CGFloat fontSize){
    return fontSize * UISCREEN_WIDTH / XXX_UISCREEN_WIDTH;
}
```

> 第三种：利用分类 + Method Swizzling

1. 为 UIFont 建立一个 Category。
2. 在分类中实现一个自定义的 ` xxx_systemFontOfSize:` 方法，在其中添加缩放字体的方法。
3. 利用 Method Swizzling 将 `systemFontOfSize:` 方法和 `xxx_systemFontOfSize:` 进行方法交换。

- 代码实现：

```objc
#import "UIFont+AdjustSwizzling.h"
#import <objc/runtime.h>

#define XXX_UISCREEN_WIDTH  375

@implementation UIFont (AdjustSwizzling)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class class = [self class];

        SEL originalSelector = @selector(systemFontOfSize:);
        SEL swizzledSelector = @selector(xxx_systemFontOfSize:);

        Method originalMethod = class_getInstanceMethod(class, originalSelector);
        Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);

        BOOL didAddMethod = class_addMethod(class,
                                            originalSelector,
                                            method_getImplementation(swizzledMethod),
                                            method_getTypeEncoding(swizzledMethod));

        if (didAddMethod) {
            class_replaceMethod(class,
                                swizzledSelector,
                                method_getImplementation(originalMethod),
                                method_getTypeEncoding(originalMethod));
        } else {
            method_exchangeImplementations(originalMethod, swizzledMethod);
        }
    });
}

+ (UIFont *)xxx_systemFontOfSize:(CGFloat)fontSize {
    UIFont *newFont = nil;
    newFont = [UIFont xxx_systemFontOfSize:fontSize * [UIScreen mainScreen].bounds.size.width / XXX_UISCREEN_WIDTH];

    return newFont;
}

@end
```

注意：这种方式只适用于纯代码的情况，关于 XIB 字体根据屏幕尺寸适配，可以参考这篇博文：
[小生不怕：iOS xib 文件根据屏幕等比例缩放的适配](https://www.jianshu.com/p/cf049bebdc6c)

---

## 4.3 处理按钮重复点击

> 需求：避免一个按钮被快速多次点击。

还是来思考一下有几种做法。

> 第一种：利用 Delay 延迟，和不可点击方法。

这种方法很直观，也很简单。但就是工作量很大，需要在所有有按钮的地方添加代码。很不想承认：在之前项目中，我使用的就是这种方式。

```objc
- (void)viewDidLoad {
    [super viewDidLoad];

    UIButton *button = [[UIButton alloc]initWithFrame:CGRectMake(100, 100, 100, 100)];
    button.backgroundColor = [UIColor redColor];
    [button addTarget:self action:@selector(buttonClick:) forControlEvents:UIControlEventTouchUpInside];
    [self.view addSubview:button];
}

- (void)buttonClick:(UIButton *)sender {
    sender.enabled = NO;
    [self performSelector:@selector(changeButtonStatus:) withObject:sender afterDelay:0.8f];

    NSLog(@"点击了按钮");
}

- (void)changeButtonStatus:(UIButton *)sender {
    sender.enabled = YES;
}
```

> 第二种：利用分类 + Method Swizzling

1. 为 `UIControl` 或 `UIButton` 建立一个 Category。
2. 在分类中添加一个 `NSTimeInterval xxx_acceptEventInterval;` 的属性，设定重复点击间隔
3. 在分类中实现一个自定义的 ` xxx_sendAction:to:forEvent:` 方法，在其中添加限定时间相应的方法。
4. 利用 Method Swizzling 将 `sendAction:to:forEvent:` 方法和 `xxx_sendAction:to:forEvent:` 进行方法交换。

- 代码实现：

```Objc
#import "UIButton+DelaySwizzling.h"
#import <objc/runtime.h>

@interface UIButton()

// 重复点击间隔
@property (nonatomic, assign) NSTimeInterval xxx_acceptEventInterval;

@end


@implementation UIButton (DelaySwizzling)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class class = [self class];

        SEL originalSelector = @selector(sendAction:to:forEvent:);
        SEL swizzledSelector = @selector(xxx_sendAction:to:forEvent:);

        Method originalMethod = class_getInstanceMethod(class, originalSelector);
        Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);

        BOOL didAddMethod = class_addMethod(class,
                                            originalSelector,
                                            method_getImplementation(swizzledMethod),
                                            method_getTypeEncoding(swizzledMethod));

        if (didAddMethod) {
            class_replaceMethod(class,
                                swizzledSelector,
                                method_getImplementation(originalMethod),
                                method_getTypeEncoding(originalMethod));
        } else {
            method_exchangeImplementations(originalMethod, swizzledMethod);
        }
    });
}

- (void)xxx_sendAction:(SEL)action to:(id)target forEvent:(UIEvent *)event {

    // 如果想要设置统一的间隔时间，可以在此处加上以下几句
    if (self.xxx_acceptEventInterval <= 0) {
        // 如果没有自定义时间间隔，则默认为 0.4 秒
        self.xxx_acceptEventInterval = 0.4;
    }

    // 是否小于设定的时间间隔
    BOOL needSendAction = (NSDate.date.timeIntervalSince1970 - self.xxx_acceptEventTime >= self.xxx_acceptEventInterval);

    // 更新上一次点击时间戳
    if (self.xxx_acceptEventInterval > 0) {
        self.xxx_acceptEventTime = NSDate.date.timeIntervalSince1970;
    }

    // 两次点击的时间间隔小于设定的时间间隔时，才执行响应事件
    if (needSendAction) {
        [self xxx_sendAction:action to:target forEvent:event];
    }
}

- (NSTimeInterval )xxx_acceptEventInterval{
    return [objc_getAssociatedObject(self, "UIControl_acceptEventInterval") doubleValue];
}

- (void)setXxx_acceptEventInterval:(NSTimeInterval)xxx_acceptEventInterval{
    objc_setAssociatedObject(self, "UIControl_acceptEventInterval", @(xxx_acceptEventInterval), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSTimeInterval )xxx_acceptEventTime{
    return [objc_getAssociatedObject(self, "UIControl_acceptEventTime") doubleValue];
}

- (void)setXxx_acceptEventTime:(NSTimeInterval)xxx_acceptEventTime{
    objc_setAssociatedObject(self, "UIControl_acceptEventTime", @(xxx_acceptEventTime), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

@end
```

参考博文：[大斑马小斑马：IOS 防止 UIButton 重复点击](https://www.jianshu.com/p/e5a609f01af4)

---

## 4.4 TableView、CollectionView 异常加载占位图

在项目中遇到网络异常，或者其他各种原因造成 TableView、CollectionView 数据为空的时候，通常需要加载占位图显示。那么加载占位图有没有什么好的方法或技巧？

> 第一种：刷新数据后进行判断

这应该是通常的做法。当返回数据，刷新 TableView、CollectionView 时候，进行判断，如果数据为空，则加载占位图。如果数据不为空，则移除占位图，显示数据。

> 第二种：利用分类 + Method Swizzling 重写 `reloadData` 方法。

以 TableView 为例：

1. 为 TableView 建立一个 Category，Category 中添加刷新回调 block 属性、占位图 View 属性。
2. 在分类中实现一个自定义的 ` xxx_reloadData` 方法，在其中添加判断是否为空，以及加载占位图、隐藏占位图的相关代码。
3. 利用 Method Swizzling 将 `reloadData` 方法和 `xxx_reloadData` 进行方法交换。

- 代码实现：

```Objc
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UITableView (ReloadDataSwizzling)

@property (nonatomic, assign) BOOL firstReload;
@property (nonatomic, strong) UIView *placeholderView;
@property (nonatomic,   copy) void(^reloadBlock)(void);

@end

/*--------------------------------------*/

#import "UITableView+ReloadDataSwizzling.h"
#import "XXXPlaceholderView.h"
#import <objc/runtime.h>

@implementation UITableView (ReloadDataSwizzling)


+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class class = [self class];

        SEL originalSelector = @selector(reloadData);
        SEL swizzledSelector = @selector(xxx_reloadData);

        Method originalMethod = class_getInstanceMethod(class, originalSelector);
        Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);

        BOOL didAddMethod = class_addMethod(class,
                                            originalSelector,
                                            method_getImplementation(swizzledMethod),
                                            method_getTypeEncoding(swizzledMethod));

        if (didAddMethod) {
            class_replaceMethod(class,
                                swizzledSelector,
                                method_getImplementation(originalMethod),
                                method_getTypeEncoding(originalMethod));
        } else {
            method_exchangeImplementations(originalMethod, swizzledMethod);
        }
    });
}

- (void)xxx_reloadData {
    if (!self.firstReload) {
        [self checkEmpty];
    }
    self.firstReload = NO;

    [self xxx_reloadData];
}


- (void)checkEmpty {
    BOOL isEmpty = YES; // 判空 flag 标示

    id <UITableViewDataSource> dataSource = self.dataSource;
    NSInteger sections = 1; // 默认TableView 只有一组
    if ([dataSource respondsToSelector:@selector(numberOfSectionsInTableView:)]) {
        sections = [dataSource numberOfSectionsInTableView:self] - 1; // 获取当前TableView 组数
    }

    for (NSInteger i = 0; i <= sections; i++) {
        NSInteger rows = [dataSource tableView:self numberOfRowsInSection:i]; // 获取当前TableView各组行数
        if (rows) {
            isEmpty = NO; // 若行数存在，不为空
        }
    }
    if (isEmpty) { // 若为空，加载占位图
        if (!self.placeholderView) { // 若未自定义，加载默认占位图
            [self makeDefaultPlaceholderView];
        }
        self.placeholderView.hidden = NO;
        [self addSubview:self.placeholderView];
    } else { // 不为空，隐藏占位图
        self.placeholderView.hidden = YES;
    }
}

- (void)makeDefaultPlaceholderView {
    self.bounds = CGRectMake(0, 0, self.frame.size.width, self.frame.size.height);
    XXXPlaceholderView *placeholderView = [[XXXPlaceholderView alloc] initWithFrame:self.bounds];
    __weak typeof(self) weakSelf = self;
    [placeholderView setReloadClickBlock:^{
        if (weakSelf.reloadBlock) {
            weakSelf.reloadBlock();
        }
    }];
    self.placeholderView = placeholderView;
}

- (BOOL)firstReload {
    return [objc_getAssociatedObject(self, @selector(firstReload)) boolValue];
}

- (void)setFirstReload:(BOOL)firstReload {
    objc_setAssociatedObject(self, @selector(firstReload), @(firstReload), OBJC_ASSOCIATION_ASSIGN);
}

- (UIView *)placeholderView {
    return objc_getAssociatedObject(self, @selector(placeholderView));
}

- (void)setPlaceholderView:(UIView *)placeholderView {
    objc_setAssociatedObject(self, @selector(placeholderView), placeholderView, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void (^)(void))reloadBlock {
    return objc_getAssociatedObject(self, @selector(reloadBlock));
}

- (void)setReloadBlock:(void (^)(void))reloadBlock {
    objc_setAssociatedObject(self, @selector(reloadBlock), reloadBlock, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

@end
```

参考博文：[卖报的小画家 Sure：零行代码为 App 添加异常加载占位图](https://www.jianshu.com/p/7fda2d9e9d48)

---

## 4.5 APM（应用性能管理）、防止程序崩溃

1. 通过 Method Swizzling 替换 NSURLConnection , NSURLSession 相关的原始实现（例如 NSURLConnection 的构造方法和 start 方法），在实现中加入网络性能埋点行为，然后调用原始实现。从而来监控网络。
2. 防止程序崩溃，可以通过 Method Swizzling 拦截容易造成崩溃的系统方法，然后在替换方法捕获异常类型 NSException ，再对异常进行处理。最常见的例子就是拦截 `arrayWithObjects:count:` 方法避免数组越界，这种例子网上很多，就不再展示代码了。

- 一些利用 Method Swizzling 特性进行 APM（应用性能管理） 的例子：
  - [New Relic：https://newrelic.com](https://newrelic.com)
  - [听云 APM：https://www.tingyun.com](https://www.tingyun.com)
  - [NetEaseAPM：http://apm.netease.com/](http://apm.netease.com/)
  - [ONE APM：https://www.oneapm.com/](https://www.oneapm.com/)
- 防止程序崩溃的开源项目：
  - [GitHub：chenfanfang](https://github.com/chenfanfang) / **[AvoidCrash](https://github.com/chenfanfang/AvoidCrash)**
  - [GitHub：ValiantCat](https://github.com/ValiantCat) / **[XXShield](https://github.com/ValiantCat/XXShield)**

---

# 参考资料

- [Stack Overflow ：What are the dangers of method swizzling in Objective-C ？](https://stackoverflow.com/questions/5339276/what-are-the-dangers-of-method-swizzling-in-objective-c)
- [NSHipster：Method Swizzling](https://nshipster.cn/method-swizzling/)
- [雷纯锋的技术博客：Objective-C Method Swizzling 的最佳实践](http://blog.leichunfeng.com/blog/2015/06/14/objective-c-method-swizzling-best-practice/)
- [学习无底：Method swizzling 的正确姿势](https://www.jianshu.com/p/674bd221aac2)
- [玉令天下的博客：Objective-C Method Swizzling](http://yulingtianxia.com/blog/2017/04/17/Objective-C-Method-Swizzling/)
- [刘小壮：iOS 黑魔法 - Method Swizzling](https://www.jianshu.com/p/ff19c04b34d0)
- [卖报的小画家 Sure：Runtime Method Swizzling 开发实例汇总](https://www.jianshu.com/p/f6dad8e1b848)

---

# 最后

写 Method Swizzling 花费了整整两周的时间，其中查阅了大量的 Method Swizzling 相关的资料，但得到的收获是很值得的。同时希望能带给大家一些帮助。

文中如若有误，烦请指正，感谢。
