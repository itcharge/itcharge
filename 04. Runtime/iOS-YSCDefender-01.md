---
title: iOS 开发：『Crash 防护系统』（一）Unrecognized Selector
date: 2019-08-23 12:07:15
tags:
    - 技术
    - iOS 开发
categories:
    - 00 - 技术 - iOS 开发
---

> 本文是 **『Crash 防护系统』系列** 第一篇。
> 这个系列将会介绍如何设计一套 APP Crash 防护系统。这套系统采用 AOP（面向切面编程）的设计思想，利用 Objective-C语言的运行时机制，在不侵入原有项目代码的基础之上，通过在 APP 运行时阶段对崩溃因素的的拦截和处理，使得 APP 能够持续稳定正常的运行。

<!--more-->

> 通过本文，您将了解到：
> 1. Crash 防护系统开篇
> 2. 防护原理简介和常见 Crash
> 3. Method Swizzling 方法的封装
> 4. Unrecognized Selector 防护
>     4.1 unrecognized selector sent to instance（找不到对象方法的实现）
>     4.2 unrecognized selector sent to class（找不到类方法实现）
> 
> 文中示例代码在： [bujige](https://github.com/bujige) / **[YSC-Avoid-Crash](https://github.com/bujige/YSC-Avoid-Crash)**

---



![](http://qncdn.bujige.net/images/iOS-YSCDefender-01-001.jpg)

---

# 1. Crash 防护系统开篇

 APP 的崩溃问题，一直以来都是开发过程中重中之重的问题。日常开发阶段的崩溃，发现后还能够立即处理。但是一旦发布上架的版本出现问题，就需要紧急加班修复 BUG，再更新上架新版本了。在这个过程中， 说不定会因为崩溃而导致关键业务中断、用户存留率下降、品牌口碑变差、生命周期价值下降等，最终导致流失用户，影响到公司的发展。

当然，避免崩溃问题的最好办法就是不产生崩溃。在开发的过程中就要尽可能地保证程序的健壮性。但是，人又不是机器，不可能不犯错。不可能存在没有 BUG 的程序。但是如果能够利用一些语言机制和系统方法，设计一套防护系统，使之能够有效的降低 APP 的崩溃率，那么不仅 APP 的稳定性得到了保障，而且最重要的是可以减少不必要的加班。

这套 Crash 防护系统被命名为：**『YSCDefender（防卫者）』**。Defender 也是路虎旗下最硬派的越野车系。在电影《Tomb Raider》里面，由 Angelina Jolie 饰演的英国女探险家 Lara Croft，所驾驶的就是一台 Defender。Defender 也是我比较喜欢的车之一。

不过呢，这不重要。。。我就是为这个项目起了个花里胡哨的名字，并给这个名字赋予了一些无聊的意义。。。

---

# 2. 防护原理简介和常见 Crash 


`Objective-C` 语言是一门动态语言，我们可以利用 `Objective-C` 语言的 `Runtime` 运行时机制，对需要 `Hook` 的类添加 `Category（分类）`，在各个分类的 `+(void)load;` 中通过 `Method Swizzling` 拦截容易造成崩溃的系统方法，将系统原有方法与添加的防护方法的 `selector（方法选择器）` 与 IMP（函数实现指针）进行对调。然后在替换方法中添加防护操作，从而达到避免以及修复崩溃的目的。

> 通过 Runtime 机制可以避免的常见 Crash ：
> 1. unrecognized selector sent to instance（找不到对象方法的实现）
> 2. unrecognized selector sent to class（找不到类方法实现）
> 3. KVO Crash
> 4. KVC Crash
> 5. NSNotification Crash
> 6. NSTimer Crash
> 7. Container Crash（集合类操作造成的崩溃，例如数组越界，插入 nil 等）
> 8. NSString Crash （字符串类操作造成的崩溃）
> 9. Bad Access Crash （野指针）
> 10. Threading Crash （非主线程刷 UI）
> 11. NSNull Crash


这一篇我们先来讲解下 `unrecognized selector sent to instance（找不到对象方法的实现）` 和 `unrecognized selector sent to class（找不到类方法实现）` 造成的崩溃问题。

---

# 3. Method Swizzling 方法的封装

由于这几种常见 Crash 的防护都需要用到 Method Swizzling 技术。所以我们可以为 NSObject 新建一个分类，将 Method Swizzling 相关的方法封装起来。

```Objc
/********************* NSObject+MethodSwizzling.h 文件 *********************/

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NSObject (MethodSwizzling)

/** 交换两个类方法的实现
 * @param originalSelector  原始方法的 SEL
 * @param swizzledSelector  交换方法的 SEL
 * @param targetClass  类
 */
+ (void)yscDefenderSwizzlingClassMethod:(SEL)originalSelector withMethod:(SEL)swizzledSelector withClass:(Class)targetClass;

/** 交换两个对象方法的实现
 * @param originalSelector  原始方法的 SEL
 * @param swizzledSelector 交换方法的 SEL
 * @param targetClass  类
 */
+ (void)yscDefenderSwizzlingInstanceMethod:(SEL)originalSelector withMethod:(SEL)swizzledSelector withClass:(Class)targetClass;

@end

/********************* NSObject+MethodSwizzling.m 文件 *********************/

#import "NSObject+MethodSwizzling.h"
#import <objc/runtime.h>

@implementation NSObject (MethodSwizzling)

// 交换两个类方法的实现
+ (void)yscDefenderSwizzlingClassMethod:(SEL)originalSelector withMethod:(SEL)swizzledSelector withClass:(Class)targetClass {
    swizzlingClassMethod(targetClass, originalSelector, swizzledSelector);
}

// 交换两个对象方法的实现
+ (void)yscDefenderSwizzlingInstanceMethod:(SEL)originalSelector withMethod:(SEL)swizzledSelector withClass:(Class)targetClass {
    swizzlingInstanceMethod(targetClass, originalSelector, swizzledSelector);
}

// 交换两个类方法的实现 C 函数
void swizzlingClassMethod(Class class, SEL originalSelector, SEL swizzledSelector) {

    Method originalMethod = class_getClassMethod(class, originalSelector);
    Method swizzledMethod = class_getClassMethod(class, swizzledSelector);

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
}

// 交换两个对象方法的实现 C 函数
void swizzlingInstanceMethod(Class class, SEL originalSelector, SEL swizzledSelector) {
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
}

@end
```
---


# 4. Unrecognized Selector 防护

## 4.1 unrecognized selector sent to instance（找不到对象方法的实现）


如果被调用的对象方法没有实现，那么程序在运行中调用该方法时，就会因为找不到对应的方法实现，从而导致 APP 崩溃。比如下面这样的代码：

```
UIButton *testButton = [[UIButton alloc] init];
[testButton performSelector:@selector(someMethod:)];
```

`testButton` 是一个 `UIButton` 对象，而 `UIButton` 类中并没有实现 `someMethod:` 方法。所以向 `testButoon` 对象发送 `someMethod:` 方法，就会导致 `testButoon` 对象无法找到对应的方法实现，最终导致 APP 的崩溃。

**那么有办法解决这类因为找不到方法的实现而导致程序崩溃的方法吗？**

我们从『 [iOS 开发：『Runtime』详解（一）基础知识](https://www.jianshu.com/p/633e5d8386a8)』知道了消息转发机制中三大步骤：**消息动态解析**、**消息接受者重定向**、**消息重定向**。通过这三大步骤，可以让我们在程序找不到调用方法崩溃之前，拦截方法调用。

大致流程如下：
1. 消息动态解析：Objective-C 运行时会调用 `+resolveInstanceMethod:` 或者 `+resolveClassMethod:`，让你有机会提供一个函数实现。我们可以通过重写这两个方法，添加其他函数实现，并返回 YES， 那运行时系统就会重新启动一次消息发送的过程。若返回 NO 或者没有添加其他函数实现，则进入下一步。
2. 消息接受者重定向：如果当前对象实现了 `forwardingTargetForSelector:`，Runtime 就会调用这个方法，允许我们将消息的接受者转发给其他对象。如果这一步方法返回 `nil`，则进入下一步。
3. 消息重定向：Runtime 系统利用 `methodSignatureForSelector:` 方法获取函数的参数和返回值类型。
    - 如果 `methodSignatureForSelector:` 返回了一个 `NSMethodSignature` 对象（函数签名），Runtime 系统就会创建一个 NSInvocation 对象，并通过 `forwardInvocation:` 消息通知当前对象，给予此次消息发送最后一次寻找 IMP 的机会。
    - 如果 `methodSignatureForSelector:` 返回 `nil`。则 Runtime 系统会发出 `doesNotRecognizeSelector:` 消息，程序也就崩溃了。

![Runtime 消息转发步骤图.png](\images\iOS-Runtime-01-003.png)


这里我们选择第二步（消息接受者重定向）来进行拦截。因为 `-forwardingTargetForSelector` 方法可以将消息转发给一个对象，开销较小，并且被重写的概率较低，适合重写。

具体步骤如下：

1. 给 NSObject 添加一个分类，在分类中实现一个自定义的 `-ysc_forwardingTargetForSelector:` 方法；
2. 利用 Method Swizzling 将 `-forwardingTargetForSelector:`  和 `-ysc_forwardingTargetForSelector:` 进行方法交换。
3. 在自定义的方法中，先判断当前对象是否已经实现了消息接受者重定向和消息重定向。如果都没有实现，就动态创建一个目标类，给目标类动态添加一个方法。
4. 把消息转发给动态生成类的实例对象，由目标类动态创建的方法实现，这样 APP 就不会崩溃了。

实现代码如下：

```Objc
#import "NSObject+SelectorDefender.h"
#import "NSObject+MethodSwizzling.h"
#import <objc/runtime.h>

@implementation NSObject (SelectorDefender)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
 
        // 拦截 `-forwardingTargetForSelector:` 方法，替换自定义实现
        [NSObject yscDefenderSwizzlingInstanceMethod:@selector(forwardingTargetForSelector:)
                                          withMethod:@selector(ysc_forwardingTargetForSelector:)
                                           withClass:[NSObject class]];
        
    });
}

// 自定义实现 `-ysc_forwardingTargetForSelector:` 方法
- (id)ysc_forwardingTargetForSelector:(SEL)aSelector {
    
    SEL forwarding_sel = @selector(forwardingTargetForSelector:);
    
    // 获取 NSObject 的消息转发方法
    Method root_forwarding_method = class_getInstanceMethod([NSObject class], forwarding_sel);
    // 获取 当前类 的消息转发方法
    Method current_forwarding_method = class_getInstanceMethod([self class], forwarding_sel);
    
    // 判断当前类本身是否实现第二步:消息接受者重定向
    BOOL realize = method_getImplementation(current_forwarding_method) != method_getImplementation(root_forwarding_method);
    
    // 如果没有实现第二步:消息接受者重定向
    if (!realize) {
        // 判断有没有实现第三步:消息重定向
        SEL methodSignature_sel = @selector(methodSignatureForSelector:);
        Method root_methodSignature_method = class_getInstanceMethod([NSObject class], methodSignature_sel);
        
        Method current_methodSignature_method = class_getInstanceMethod([self class], methodSignature_sel);
        realize = method_getImplementation(current_methodSignature_method) != method_getImplementation(root_methodSignature_method);
        
        // 如果没有实现第三步:消息重定向
        if (!realize) {
            // 创建一个新类
            NSString *errClassName = NSStringFromClass([self class]);
            NSString *errSel = NSStringFromSelector(aSelector);
            NSLog(@"出问题的类，出问题的对象方法 == %@ %@", errClassName, errSel);
            
            NSString *className = @"CrachClass";
            Class cls = NSClassFromString(className);
            
            // 如果类不存在 动态创建一个类
            if (!cls) {
                Class superClsss = [NSObject class];
                cls = objc_allocateClassPair(superClsss, className.UTF8String, 0);
                // 注册类
                objc_registerClassPair(cls);
            }
            // 如果类没有对应的方法，则动态添加一个
            if (!class_getInstanceMethod(NSClassFromString(className), aSelector)) {
                class_addMethod(cls, aSelector, (IMP)Crash, "@@:@");
            }
            // 把消息转发到当前动态生成类的实例对象上
            return [[cls alloc] init];
        }
    }
    return [self ysc_forwardingTargetForSelector:aSelector];
}

// 动态添加的方法实现
static int Crash(id slf, SEL selector) {
    return 0;
}

@end
```
---

## 4.2 unrecognized selector sent to class（找不到类方法实现）

同对象方法一样，如果被调用的类方法没有实现，那么同样也会导致 APP 崩溃。

例如，有这样一个类，声明了一个 `+ (id)aClassFunc;` 的类方法， 但是并没有实现，就像下边的 `YSCObject` 这样。

```Objc
/********************* YSCObject.h 文件 *********************/
#import <Foundation/Foundation.h>

@interface YSCObject : NSObject

+ (id)aClassFunc;

@end

/********************* YSCObject.m 文件 *********************/
#import "YSCObject.h"

@implementation YSCObject

@end
```

如果我们直接调用 `[YSCObject aClassFunc];` 就会导致崩溃。

找不到类方法实现的解决方法和之前类似，我们可以利用 Method Swizzling 将 `+forwardingTargetForSelector:` 和 `+ysc_forwardingTargetForSelector:` 进行方法交换。

```Ojbc
#import "NSObject+SelectorDefender.h"
#import "NSObject+MethodSwizzling.h"
#import <objc/runtime.h>

@implementation NSObject (SelectorDefender)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        
        // 拦截 `+forwardingTargetForSelector:` 方法，替换自定义实现
        [NSObject yscDefenderSwizzlingClassMethod:@selector(forwardingTargetForSelector:)
                                       withMethod:@selector(ysc_forwardingTargetForSelector:)
                                        withClass:[NSObject class]];
    });
}

// 自定义实现 `+ysc_forwardingTargetForSelector:` 方法
+ (id)ysc_forwardingTargetForSelector:(SEL)aSelector {
    SEL forwarding_sel = @selector(forwardingTargetForSelector:);
    
    // 获取 NSObject 的消息转发方法
    Method root_forwarding_method = class_getClassMethod([NSObject class], forwarding_sel);
    // 获取 当前类 的消息转发方法
    Method current_forwarding_method = class_getClassMethod([self class], forwarding_sel);
    
    // 判断当前类本身是否实现第二步:消息接受者重定向
    BOOL realize = method_getImplementation(current_forwarding_method) != method_getImplementation(root_forwarding_method);
    
    // 如果没有实现第二步:消息接受者重定向
    if (!realize) {
        // 判断有没有实现第三步:消息重定向
        SEL methodSignature_sel = @selector(methodSignatureForSelector:);
        Method root_methodSignature_method = class_getClassMethod([NSObject class], methodSignature_sel);
        
        Method current_methodSignature_method = class_getClassMethod([self class], methodSignature_sel);
        realize = method_getImplementation(current_methodSignature_method) != method_getImplementation(root_methodSignature_method);
        
        // 如果没有实现第三步:消息重定向
        if (!realize) {
            // 创建一个新类
            NSString *errClassName = NSStringFromClass([self class]);
            NSString *errSel = NSStringFromSelector(aSelector);
            NSLog(@"出问题的类，出问题的类方法 == %@ %@", errClassName, errSel);
            
            NSString *className = @"CrachClass";
            Class cls = NSClassFromString(className);
            
            // 如果类不存在 动态创建一个类
            if (!cls) {
                Class superClsss = [NSObject class];
                cls = objc_allocateClassPair(superClsss, className.UTF8String, 0);
                // 注册类
                objc_registerClassPair(cls);
            }
            // 如果类没有对应的方法，则动态添加一个
            if (!class_getInstanceMethod(NSClassFromString(className), aSelector)) {
                class_addMethod(cls, aSelector, (IMP)Crash, "@@:@");
            }
            // 把消息转发到当前动态生成类的实例对象上
            return [[cls alloc] init];
        }
    }
    return [self ysc_forwardingTargetForSelector:aSelector];
}

// 动态添加的方法实现
static int Crash(id slf, SEL selector) {
    return 0;
}

@end
```

将 4.1 和 4.2 结合起来就可以拦截所有未实现的类方法和对象方法了。具体实现可参考我的 DEMO： [bujige](https://github.com/bujige) / **[YSC-Avoid-Crash](https://github.com/bujige/YSC-Avoid-Crash)**

---

# 参考资料

- [How Not to Crash](https://inessential.com/hownottocrash)
- [iOS 防止应用崩溃](https://www.jianshu.com/p/8f1fb138ff8d)
- [大白健康系统--iOS APP运行时Crash自动修复系统](https://neyoufan.github.io/2017/01/13/ios/BayMax_HTSafetyGuard)

