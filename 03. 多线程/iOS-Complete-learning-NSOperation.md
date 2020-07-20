---
title: iOS 多线程：『NSOperation、NSOperationQueue』详尽总结
date: 2018-03-06 15:38:52
tags:
    - 技术
    - iOS 开发
categories:
    - 00 - 技术 - iOS 开发
---


> 本文用来介绍 iOS 多线程中 NSOperation、NSOperationQueue 的相关知识以及使用方法。
> 通过本文，您将了解到：
> **NSOperation、NSOperationQueue 简介**、**操作和操作队列**、**使用步骤和基本使用方法**、**控制串行/并发执行**、**NSOperation 操作依赖和优先级**、**线程间的通信**、**线程同步和线程安全**，以及 **NSOperation、NSOperationQueue 常用属性和方法归纳**。

<!--more-->

![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-001.png)

> 文中 Demo 我已放在了 Github 上，Demo 链接：[传送门](https://github.com/bujige/YSC-NSOperation-demo)

# 1. NSOperation、NSOperationQueue 简介

NSOperation、NSOperationQueue 是苹果提供给我们的一套多线程解决方案。实际上 NSOperation、NSOperationQueue 是基于 GCD 更高一层的封装，完全面向对象。但是比 GCD 更简单易用、代码可读性也更高。

**为什么要使用 NSOperation、NSOperationQueue？**
1. 可添加完成的代码块，在操作完成后执行。
2. 添加操作之间的依赖关系，方便的控制执行顺序。
3. 设定操作执行的优先级。
4. 可以很方便的取消一个操作的执行。
5. 使用 KVO 观察对操作执行状态的更改：isExecuteing、isFinished、isCancelled。

# 2. NSOperation、NSOperationQueue 操作和操作队列

既然是基于 GCD 的更高一层的封装。那么，GCD 中的一些概念同样适用于 NSOperation、NSOperationQueue。在 NSOperation、NSOperationQueue 中也有类似的**任务（操作）**和**队列（操作队列）**的概念。

- **操作（Operation）：**
    - 执行操作的意思，换句话说就是你在线程中执行的那段代码。
    - 在 GCD 中是放在 block 中的。在 NSOperation 中，我们使用 NSOperation 子类 **NSInvocationOperation**、**NSBlockOperation**，或者**自定义子类**来封装操作。
- **操作队列（Operation Queues）：**
    - 这里的队列指操作队列，即用来存放操作的队列。不同于 GCD 中的调度队列 FIFO（先进先出）的原则。NSOperationQueue 对于添加到队列中的操作，首先进入准备就绪的状态（就绪状态取决于操作之间的依赖关系），然后进入就绪状态的操作的**开始执行顺序**（非结束执行顺序）由操作之间相对的优先级决定（优先级是操作对象自身的属性）。
    - 操作队列通过设置**最大并发操作数（maxConcurrentOperationCount）**来控制并发、串行。
    - NSOperationQueue 为我们提供了两种不同类型的队列：主队列和自定义队列。主队列运行在主线程之上，而自定义队列在后台执行。

# 3. NSOperation、NSOperationQueue 使用步骤

NSOperation 需要配合 NSOperationQueue 来实现多线程。因为默认情况下，NSOperation 单独使用时系统同步执行操作，配合 NSOperationQueue 我们能更好的实现异步执行。

NSOperation 实现多线程的使用步骤分为三步：
1. 创建操作：先将需要执行的操作封装到一个 NSOperation 对象中。
2. 创建队列：创建 NSOperationQueue 对象。
3. 将操作加入到队列中：将 NSOperation 对象添加到 NSOperationQueue 对象中。

之后呢，系统就会自动将 NSOperationQueue 中的 NSOperation 取出来，在新线程中执行操作。


下面我们来学习下 NSOperation 和 NSOperationQueue 的基本使用。

# 4. NSOperation 和 NSOperationQueue 基本使用

## 4.1 创建操作

NSOperation 是个抽象类，不能用来封装操作。我们只有使用它的子类来封装操作。我们有三种方式来封装操作。

1. 使用子类 NSInvocationOperation
2. 使用子类 NSBlockOperation
3. 自定义继承自 NSOperation 的子类，通过实现内部相应的方法来封装操作。

在不使用 NSOperationQueue，单独使用 NSOperation 的情况下系统同步执行操作，下面我们学习以下操作的三种创建方式。

### 4.1.1 使用子类 `NSInvocationOperation`

```objc
/**
 * 使用子类 NSInvocationOperation
 */
- (void)useInvocationOperation {

    // 1.创建 NSInvocationOperation 对象
    NSInvocationOperation *op = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(task1) object:nil];

    // 2.调用 start 方法开始执行操作
    [op start];
}

/**
 * 任务1
 */
- (void)task1 {
    for (int i = 0; i < 2; i++) {
        [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
        NSLog(@"1---%@", [NSThread currentThread]); // 打印当前线程
    }
}
```

> 输出结果：
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-002.png)

- 可以看到：在没有使用 NSOperationQueue、在主线程中单独使用使用子类 NSInvocationOperation 执行一个操作的情况下，操作是在当前线程执行的，并没有开启新线程。

如果在其他线程中执行操作，则打印结果为其他线程。
```objc
// 在其他线程使用子类 NSInvocationOperation
[NSThread detachNewThreadSelector:@selector(useInvocationOperation) toTarget:self withObject:nil];
```

> 输出结果：
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-003.png)

- 可以看到：在其他线程中单独使用子类 NSInvocationOperation，操作是在当前调用的其他线程执行的，并没有开启新线程。

下边再来看看 NSBlockOperation。

### 4.1.2 使用子类 `NSBlockOperation`

```objc
/**
 * 使用子类 NSBlockOperation
 */
- (void)useBlockOperation {

    // 1.创建 NSBlockOperation 对象
    NSBlockOperation *op = [NSBlockOperation blockOperationWithBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"1---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];

    // 2.调用 start 方法开始执行操作
    [op start];
}
```

> 输出结果：
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-004.png)

- 可以看到：在没有使用 NSOperationQueue、在主线程中单独使用 NSBlockOperation 执行一个操作的情况下，操作是在当前线程执行的，并没有开启新线程。

> 注意：和上边 NSInvocationOperation 使用一样。因为代码是在主线程中调用的，所以打印结果为主线程。如果在其他线程中执行操作，则打印结果为其他线程。


但是，NSBlockOperation 还提供了一个方法 `addExecutionBlock:`，通过 `addExecutionBlock:` 就可以为 NSBlockOperation 添加额外的操作。这些操作（包括 blockOperationWithBlock 中的操作）可以在不同的线程中同时（并发）执行。只有当所有相关的操作已经完成执行时，才视为完成。

如果添加的操作多的话，` blockOperationWithBlock:` 中的操作也可能会在其他线程（非当前线程）中执行，这是由系统决定的，并不是说添加到 `blockOperationWithBlock:` 中的操作一定会在当前线程中执行。（可以使用 `addExecutionBlock:` 多添加几个操作试试）。

```obj
/**
 * 使用子类 NSBlockOperation
 * 调用方法 AddExecutionBlock:
 */
- (void)useBlockOperationAddExecutionBlock {

    // 1.创建 NSBlockOperation 对象
    NSBlockOperation *op = [NSBlockOperation blockOperationWithBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"1---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];

    // 2.添加额外的操作
    [op addExecutionBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"2---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
    [op addExecutionBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"3---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
    [op addExecutionBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"4---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
    [op addExecutionBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"5---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
    [op addExecutionBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"6---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
    [op addExecutionBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"7---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
    [op addExecutionBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"8---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];

    // 3.调用 start 方法开始执行操作
    [op start];
}
```

> 输出结果：
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-005.png)

- 可以看出：使用子类 `NSBlockOperation`，并调用方法 `AddExecutionBlock:` 的情况下，`blockOperationWithBlock:`方法中的操作 和 `addExecutionBlock:` 中的操作是在不同的线程中异步执行的。而且，这次执行结果中 `blockOperationWithBlock:`方法中的操作也不是在当前线程（主线程）中执行的。从而印证了` blockOperationWithBlock:` 中的操作也可能会在其他线程（非当前线程）中执行。

一般情况下，如果一个 NSBlockOperation 对象封装了多个操作。NSBlockOperation 是否开启新线程，取决于操作的个数。如果添加的操作的个数多，就会自动开启新线程。当然开启的线程数是由系统来决定的。

### 4.1.3 使用自定义继承自 NSOperation 的子类

如果使用子类 NSInvocationOperation、NSBlockOperation 不能满足日常需求，我们可以使用自定义继承自 NSOperation 的子类。可以通过重写 `main` 或者 `start` 方法 来定义自己的 NSOperation 对象。重写`main`方法比较简单，我们不需要管理操作的状态属性 `isExecuting` 和 `isFinished`。当 `main` 执行完返回的时候，这个操作就结束了。

先定义一个继承自 NSOperation 的子类，重写`main`方法。

```objc
// YSCOperation.h 文件
#import <Foundation/Foundation.h>

@interface YSCOperation : NSOperation

@end

// YSCOperation.m 文件
#import "YSCOperation.h"

@implementation YSCOperation

- (void)main {
    if (!self.isCancelled) {
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2];
            NSLog(@"1---%@", [NSThread currentThread]);
        }
    }
}

@end
```

然后使用的时候导入头文件`YSCOperation.h`。

```objc
/**
 * 使用自定义继承自 NSOperation 的子类
 */
- (void)useCustomOperation {
    // 1.创建 YSCOperation 对象
    YSCOperation *op = [[YSCOperation alloc] init];
    // 2.调用 start 方法开始执行操作
    [op start];
}
```

> 输出结果：
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-006.png)

- 可以看出：在没有使用 NSOperationQueue、在主线程单独使用自定义继承自 NSOperation 的子类的情况下，是在主线程执行操作，并没有开启新线程。


下边我们来讲讲 NSOperationQueue 的创建。

## 4.2 创建队列

NSOperationQueue 一共有两种队列：主队列、自定义队列。其中自定义队列同时包含了串行、并发功能。下边是主队列、自定义队列的基本创建方法和特点。
- 主队列
    - 凡是添加到主队列中的操作，都会放到主线程中执行。

```objc
// 主队列获取方法
NSOperationQueue *queue = [NSOperationQueue mainQueue];
```

- 自定义队列（非主队列）
    - 添加到这种队列中的操作，就会自动放到子线程中执行。
    - 同时包含了：串行、并发功能。

```objc
// 自定义队列创建方法
NSOperationQueue *queue = [[NSOperationQueue alloc] init];
```

## 4.3 将操作加入到队列中

上边我们说到 NSOperation 需要配合 NSOperationQueue 来实现多线程。

那么我们需要将创建好的操作加入到队列中去。总共有两种方法：

1. `- (void)addOperation:(NSOperation *)op;`
    - 需要先创建操作，再将创建好的操作加入到创建好的队列中去。

```objc
/**
 * 使用 addOperation: 将操作加入到操作队列中
 */
- (void)addOperationToQueue {

    // 1.创建队列
    NSOperationQueue *queue = [[NSOperationQueue alloc] init];

    // 2.创建操作
    // 使用 NSInvocationOperation 创建操作1
    NSInvocationOperation *op1 = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(task1) object:nil];

    // 使用 NSInvocationOperation 创建操作2
    NSInvocationOperation *op2 = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(task2) object:nil];

    // 使用 NSBlockOperation 创建操作3
    NSBlockOperation *op3 = [NSBlockOperation blockOperationWithBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"3---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
    [op3 addExecutionBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"4---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];

    // 3.使用 addOperation: 添加所有操作到队列中
    [queue addOperation:op1]; // [op1 start]
    [queue addOperation:op2]; // [op2 start]
    [queue addOperation:op3]; // [op3 start]
}
```

> 输出结果：
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-007.png)

- 可以看出：使用 NSOperation 子类创建操作，并使用 `addOperation:` 将操作加入到操作队列后能够开启新线程，进行并发执行。 

2. `- (void)addOperationWithBlock:(void (^)(void))block;`
    - 无需先创建操作，在 block 中添加操作，直接将包含操作的 block 加入到队列中。

```objc
/**
 * 使用 addOperationWithBlock: 将操作加入到操作队列中
 */

- (void)addOperationWithBlockToQueue {
    // 1.创建队列
    NSOperationQueue *queue = [[NSOperationQueue alloc] init];

    // 2.使用 addOperationWithBlock: 添加操作到队列中
    [queue addOperationWithBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"1---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
    [queue addOperationWithBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"2---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
    [queue addOperationWithBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"3---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
}
```

> 输出结果：
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-008.png)

- 可以看出：使用 addOperationWithBlock: 将操作加入到操作队列后能够开启新线程，进行并发执行。 

# 5. NSOperationQueue 控制串行执行、并发执行

之前我们说过，NSOperationQueue 创建的自定义队列同时具有串行、并发功能，上边我们演示了并发功能，那么他的串行功能是如何实现的？

这里有个关键属性 `maxConcurrentOperationCount `，叫做**最大并发操作数**。用来控制一个特定队列中可以有多少个操作同时参与并发执行。

> 注意：这里 `maxConcurrentOperationCount` 控制的不是并发线程的数量，而是一个队列中同时能并发执行的最大操作数。而且一个操作也并非只能在一个线程中运行。

- 最大并发操作数：`maxConcurrentOperationCount `
    - `maxConcurrentOperationCount ` 默认情况下为-1，表示不进行限制，可进行并发执行。
    - `maxConcurrentOperationCount ` 为1时，队列为串行队列。只能串行执行。
    - `maxConcurrentOperationCount ` 大于1时，队列为并发队列。操作并发执行，当然这个值不应超过系统限制，即使自己设置一个很大的值，系统也会自动调整为 min{自己设定的值，系统设定的默认最大值}。

```objc
/**
 * 设置 MaxConcurrentOperationCount（最大并发操作数）
 */
- (void)setMaxConcurrentOperationCount {

    // 1.创建队列
    NSOperationQueue *queue = [[NSOperationQueue alloc] init];

    // 2.设置最大并发操作数
    queue.maxConcurrentOperationCount = 1; // 串行队列
// queue.maxConcurrentOperationCount = 2; // 并发队列
// queue.maxConcurrentOperationCount = 8; // 并发队列

    // 3.添加操作
    [queue addOperationWithBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"1---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
    [queue addOperationWithBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"2---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
    [queue addOperationWithBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"3---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
    [queue addOperationWithBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"4---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
}
```


> 最大并发操作数为1 输出结果：
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-009.png)
> 最大并发操作数为2 输出结果：
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-010.png)

- 可以看出：当最大并发操作数为1时，操作是按顺序串行执行的，并且一个操作完成之后，下一个操作才开始执行。当最大操作并发数为2时，操作是并发执行的，可以同时执行两个操作。而开启线程数量是由系统决定的，不需要我们来管理。

这样看来，是不是比 GCD 还要简单了许多？

# 6. NSOperation 操作依赖

NSOperation、NSOperationQueue 最吸引人的地方是它能添加操作之间的依赖关系。通过操作依赖，我们可以很方便的控制操作之间的执行先后顺序。NSOperation 提供了3个接口供我们管理和查看依赖。

- `- (void)addDependency:(NSOperation *)op;` 添加依赖，使当前操作依赖于操作 op 的完成。
- `- (void)removeDependency:(NSOperation *)op;` 移除依赖，取消当前操作对操作 op 的依赖。
- `@property (readonly, copy) NSArray<NSOperation *> *dependencies;` 在当前操作开始执行之前完成执行的所有操作对象数组。

当然，我们经常用到的还是添加依赖操作。现在考虑这样的需求，比如说有 A、B 两个操作，其中 A 执行完操作，B 才能执行操作。

如果使用依赖来处理的话，那么就需要让操作 B 依赖于操作 A。具体代码如下：

```objc
/**
 * 操作依赖
 * 使用方法：addDependency:
 */
- (void)addDependency {

    // 1.创建队列
    NSOperationQueue *queue = [[NSOperationQueue alloc] init];

    // 2.创建操作
    NSBlockOperation *op1 = [NSBlockOperation blockOperationWithBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"1---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];
    NSBlockOperation *op2 = [NSBlockOperation blockOperationWithBlock:^{
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"2---%@", [NSThread currentThread]); // 打印当前线程
        }
    }];

    // 3.添加依赖
    [op2 addDependency:op1]; // 让op2 依赖于 op1，则先执行op1，在执行op2

    // 4.添加操作到队列中
    [queue addOperation:op1];
    [queue addOperation:op2];
}
```

> 输出结果：
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-011.png)


- 可以看到：通过添加操作依赖，无论运行几次，其结果都是 op1 先执行，op2 后执行。

# 7. NSOperation 优先级

NSOperation 提供了`queuePriority`（优先级）属性，`queuePriority`属性适用于同一操作队列中的操作，不适用于不同操作队列中的操作。默认情况下，所有新创建的操作对象优先级都是`NSOperationQueuePriorityNormal`。但是我们可以通过`setQueuePriority:`方法来改变当前操作在同一队列中的执行优先级。

```objc
// 优先级的取值
typedef NS_ENUM(NSInteger, NSOperationQueuePriority) {
    NSOperationQueuePriorityVeryLow = -8L,
    NSOperationQueuePriorityLow = -4L,
    NSOperationQueuePriorityNormal = 0,
    NSOperationQueuePriorityHigh = 4,
    NSOperationQueuePriorityVeryHigh = 8
};
```

上边我们说过：对于添加到队列中的操作，首先进入准备就绪的状态（就绪状态取决于操作之间的依赖关系），然后进入就绪状态的操作的**开始执行顺序**（非结束执行顺序）由操作之间相对的优先级决定（优先级是操作对象自身的属性）。

**那么，什么样的操作才是进入就绪状态的操作呢？**

- 当一个操作的所有依赖都已经完成时，操作对象通常会进入准备就绪状态，等待执行。

举个例子，现在有4个优先级都是 `NSOperationQueuePriorityNormal`（默认级别）的操作：op1，op2，op3，op4。其中 op3 依赖于 op2，op2 依赖于 op1，即 op3 -> op2 -> op1。现在将这4个操作添加到队列中并发执行。
- 因为 op1 和 op4 都没有需要依赖的操作，所以在 op1，op4 执行之前，就是出于准备就绪状态的操作。
- 而 op3 和 op2 都有依赖的操作（op3 依赖于 op2，op2 依赖于 op1），所以 op3 和 op2 都不是准备就绪状态下的操作。


理解了进入就绪状态的操作，那么我们就理解了`queuePriority` 属性的作用对象。

- `queuePriority` 属性决定了**进入准备就绪状态下的操作**之间的开始执行顺序。并且，优先级不能取代依赖关系。
- 如果一个队列中既包含高优先级操作，又包含低优先级操作，并且两个操作都已经准备就绪，那么队列先执行高优先级操作。比如上例中，如果 op1 和 op4 是不同优先级的操作，那么就会先执行优先级高的操作。
- 如果，一个队列中既包含了准备就绪状态的操作，又包含了未准备就绪的操作，未准备就绪的操作优先级比准备就绪的操作优先级高。那么，虽然准备就绪的操作优先级低，也会优先执行。优先级不能取代依赖关系。如果要控制操作间的启动顺序，则必须使用依赖关系。

# 8. NSOperation、NSOperationQueue 线程间的通信

在 iOS 开发过程中，我们一般在主线程里边进行 UI 刷新，例如：点击、滚动、拖拽等事件。我们通常把一些耗时的操作放在其他线程，比如说图片下载、文件上传等耗时操作。而当我们有时候在其他线程完成了耗时操作时，需要回到主线程，那么就用到了线程之间的通讯。


```objc
/**
 * 线程间通信
 */
- (void)communication {

    // 1.创建队列
    NSOperationQueue *queue = [[NSOperationQueue alloc]init];

    // 2.添加操作
    [queue addOperationWithBlock:^{
        // 异步进行耗时操作
        for (int i = 0; i < 2; i++) {
            [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
            NSLog(@"1---%@", [NSThread currentThread]); // 打印当前线程
        }

        // 回到主线程
        [[NSOperationQueue mainQueue] addOperationWithBlock:^{
            // 进行一些 UI 刷新等操作
            for (int i = 0; i < 2; i++) {
                [NSThread sleepForTimeInterval:2]; // 模拟耗时操作
                NSLog(@"2---%@", [NSThread currentThread]); // 打印当前线程
            }
        }];
    }];
}
```

> 输出结果：
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-012.png)

- 可以看到：通过线程间的通信，先在其他线程中执行操作，等操作执行完了之后再回到主线程执行主线程的相应操作。

# 9. NSOperation、NSOperationQueue 线程同步和线程安全 

- **线程安全**：如果你的代码所在的进程中有多个线程在同时运行，而这些线程可能会同时运行这段代码。如果每次运行结果和单线程运行的结果是一样的，而且其他的变量的值也和预期的是一样的，就是线程安全的。
若每个线程中对全局变量、静态变量只有读操作，而无写操作，一般来说，这个全局变量是线程安全的；若有多个线程同时执行写操作（更改变量），一般都需要考虑线程同步，否则的话就可能影响线程安全。
- **线程同步**：可理解为线程 A 和 线程 B 一块配合，A 执行到一定程度时要依靠线程 B 的某个结果，于是停下来，示意 B 运行；B 依言执行，再将结果给 A；A 再继续操作。

举个简单例子就是：两个人在一起聊天。两个人不能同时说话，避免听不清(操作冲突)。等一个人说完(一个线程结束操作)，另一个再说(另一个线程再开始操作)。

下面，我们模拟火车票售卖的方式，实现 NSOperation 线程安全和解决线程同步问题。
场景：总共有50张火车票，有两个售卖火车票的窗口，一个是北京火车票售卖窗口，另一个是上海火车票售卖窗口。两个窗口同时售卖火车票，卖完为止。

## 9.1 NSOperation、NSOperationQueue 非线程安全

先来看看不考虑线程安全的代码：

```objc
/**
 * 非线程安全：不使用 NSLock
 * 初始化火车票数量、卖票窗口(非线程安全)、并开始卖票
 */
- (void)initTicketStatusNotSave {
    NSLog(@"currentThread---%@",[NSThread currentThread]); // 打印当前线程

    self.ticketSurplusCount = 50;

    // 1.创建 queue1,queue1 代表北京火车票售卖窗口
    NSOperationQueue *queue1 = [[NSOperationQueue alloc] init];
    queue1.maxConcurrentOperationCount = 1;

    // 2.创建 queue2,queue2 代表上海火车票售卖窗口
    NSOperationQueue *queue2 = [[NSOperationQueue alloc] init];
    queue2.maxConcurrentOperationCount = 1;

    // 3.创建卖票操作 op1
    __weak typeof(self) weakSelf = self;
    NSBlockOperation *op1 = [NSBlockOperation blockOperationWithBlock:^{
        [weakSelf saleTicketNotSafe];
    }];

    // 4.创建卖票操作 op2
    NSBlockOperation *op2 = [NSBlockOperation blockOperationWithBlock:^{
        [weakSelf saleTicketNotSafe];
    }];

    // 5.添加操作，开始卖票
    [queue1 addOperation:op1];
    [queue2 addOperation:op2];
}

/**
 * 售卖火车票(非线程安全)
 */
- (void)saleTicketNotSafe {
    while (1) {

        if (self.ticketSurplusCount > 0) {
            //如果还有票，继续售卖
            self.ticketSurplusCount--;
            NSLog(@"%@", [NSString stringWithFormat:@"剩余票数:%d 窗口:%@", self.ticketSurplusCount, [NSThread currentThread]]);
            [NSThread sleepForTimeInterval:0.2];
        } else {
            NSLog(@"所有火车票均已售完");
            break;
        }
    }
}
```

> 输出结果：
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-013.png)
> ......
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-014.png)

- 可以看到：在不考虑线程安全，不使用 NSLock 情况下，得到票数是错乱的，这样显然不符合我们的需求，所以我们需要考虑线程安全问题。

## 9.2 NSOperation、NSOperationQueue 线程安全

线程安全解决方案：可以给线程加锁，在一个线程执行该操作的时候，不允许其他线程进行操作。iOS 实现线程加锁有很多种方式。@synchronized、 NSLock、NSRecursiveLock、NSCondition、NSConditionLock、pthread_mutex、dispatch_semaphore、OSSpinLock、atomic(property) set/ge等等各种方式。这里我们使用 NSLock 对象来解决线程同步问题。NSLock 对象可以通过进入锁时调用 lock 方法，解锁时调用 unlock 方法来保证线程安全。


考虑线程安全的代码：

```objc
/**
 * 线程安全：使用 NSLock 加锁
 * 初始化火车票数量、卖票窗口(线程安全)、并开始卖票
 */

- (void)initTicketStatusSave {
    NSLog(@"currentThread---%@",[NSThread currentThread]); // 打印当前线程

    self.ticketSurplusCount = 50;

    self.lock = [[NSLock alloc] init];  // 初始化 NSLock 对象

    // 1.创建 queue1,queue1 代表北京火车票售卖窗口
    NSOperationQueue *queue1 = [[NSOperationQueue alloc] init];
    queue1.maxConcurrentOperationCount = 1;

    // 2.创建 queue2,queue2 代表上海火车票售卖窗口
    NSOperationQueue *queue2 = [[NSOperationQueue alloc] init];
    queue2.maxConcurrentOperationCount = 1;

    // 3.创建卖票操作 op1
    __weak typeof(self) weakSelf = self;
    NSBlockOperation *op1 = [NSBlockOperation blockOperationWithBlock:^{
        [weakSelf saleTicketSafe];
    }];

    // 4.创建卖票操作 op2
    NSBlockOperation *op2 = [NSBlockOperation blockOperationWithBlock:^{
        [weakSelf saleTicketSafe];
    }];

    // 5.添加操作，开始卖票
    [queue1 addOperation:op1];
    [queue2 addOperation:op2];
}

/**
 * 售卖火车票(线程安全)
 */
- (void)saleTicketSafe {
    while (1) {

        // 加锁
        [self.lock lock];

        if (self.ticketSurplusCount > 0) {
            //如果还有票，继续售卖
            self.ticketSurplusCount--;
            NSLog(@"%@", [NSString stringWithFormat:@"剩余票数:%d 窗口:%@", self.ticketSurplusCount, [NSThread currentThread]]);
            [NSThread sleepForTimeInterval:0.2];
        }

        // 解锁
        [self.lock unlock];

        if (self.ticketSurplusCount <= 0) {
            NSLog(@"所有火车票均已售完");
            break;
        }
    }
}
```

> 输出结果：
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-015.png)
> ......
> ![](http://qncdn.bujige.net/images/iOS-Complete-learning-NSOperation-016.png)

- 可以看出：在考虑了线程安全，使用 NSLock 加锁、解锁机制的情况下，得到的票数是正确的，没有出现混乱的情况。我们也就解决了多个线程同步的问题。

# 10. NSOperation、NSOperationQueue 常用属性和方法归纳

## 10.1 NSOperation 常用属性和方法

1. 取消操作方法
    - `- (void)cancel;` 可取消操作，实质是标记 isCancelled 状态。
2. 判断操作状态方法
    - `- (BOOL)isFinished;` 判断操作是否已经结束。
    - `- (BOOL)isCancelled;` 判断操作是否已经标记为取消。
    - `- (BOOL)isExecuting;` 判断操作是否正在在运行。
    - `- (BOOL)isReady;` 判断操作是否处于准备就绪状态，这个值和操作的依赖关系相关。
3. 操作同步
    - `- (void)waitUntilFinished;` 阻塞当前线程，直到该操作结束。可用于线程执行顺序的同步。
    - `- (void)setCompletionBlock:(void (^)(void))block;` `completionBlock` 会在当前操作执行完毕时执行 completionBlock。
    - `- (void)addDependency:(NSOperation *)op;` 添加依赖，使当前操作依赖于操作 op 的完成。
    - `- (void)removeDependency:(NSOperation *)op;` 移除依赖，取消当前操作对操作 op 的依赖。
    - `@property (readonly, copy) NSArray<NSOperation *> *dependencies;` 在当前操作开始执行之前完成执行的所有操作对象数组。

## 10.2 NSOperationQueue 常用属性和方法

1. 取消/暂停/恢复操作
    - `- (void)cancelAllOperations;` 可以取消队列的所有操作。
    - `- (BOOL)isSuspended;` 判断队列是否处于暂停状态。 YES 为暂停状态，NO 为恢复状态。
    - `- (void)setSuspended:(BOOL)b; ` 可设置操作的暂停和恢复，YES 代表暂停队列，NO 代表恢复队列。
2. 操作同步
    - `- (void)waitUntilAllOperationsAreFinished;` 阻塞当前线程，直到队列中的操作全部执行完毕。
3. 添加/获取操作`
    - `- (void)addOperationWithBlock:(void (^)(void))block;` 向队列中添加一个 NSBlockOperation 类型操作对象。
    - `- (void)addOperations:(NSArray *)ops waitUntilFinished:(BOOL)wait;` 向队列中添加操作数组，wait 标志是否阻塞当前线程直到所有操作结束
    - `- (NSArray *)operations;` 当前在队列中的操作数组（某个操作执行结束后会自动从这个数组清除）。
    - `- (NSUInteger)operationCount;` 当前队列中的操作数。
4. 获取队列
    - `+ (id)currentQueue;` 获取当前队列，如果当前线程不是在 NSOperationQueue 上运行则返回 nil。
    - `+ (id)mainQueue;` 获取主队列。

> 注意：
> 1. 这里的暂停和取消（包括操作的取消和队列的取消）并不代表可以将当前的操作立即取消，而是当当前的操作执行完毕之后不再执行新的操作。
> 2. 暂停和取消的区别就在于：暂停操作之后还可以恢复操作，继续向下执行；而取消操作之后，所有的操作就清空了，无法再接着执行剩下的操作。

***
参考资料：
- [苹果官方——并发编程指南：Operation Queues](https://developer.apple.com/library/content/documentation/General/Conceptual/ConcurrencyProgrammingGuide/OperationObjects/OperationObjects.html) **推荐看看**
- [苹果官方文档：NSOperation](https://developer.apple.com/documentation/foundation/nsoperation?language=occ)
- [Objc 中国：并发编程：API 及挑战](https://objccn.io/issue-2-1/)

***
iOS多线程详尽总结系列文章：
- [iOS多线程：『pthread、NSThread』详尽总结](https://bujige.net/blog/iOS-Complete-learning-pthread-and-NSThread.html)
- [iOS多线程：『GCD』详解总结](https://bujige.net/blog/iOS-Complete-learning-GCD.html)
- [iOS多线程：『NSOperation』详解总结](https://bujige.net/blog/iOS-Complete-learning-NSOperation.html)
- [iOS多线程：『RunLoop』详解总结](https://bujige.net/blog/iOS-Complete-learning-RunLoop.html)
