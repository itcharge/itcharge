---
title: iOS 多线程：「RunLoop」详尽总结
categories:
  - iOS 开发
tags:
  - 技术
  - iOS
createTime: '2018/03/07 00:00:00'
permalink: /blogs/tech/ios/multithreading-runloop/
---

RunLoop 详尽总结，说明 CFRunLoopRef、Mode、Source、Timer、Observer 等概念及常见应用场景。

<!-- more -->

# 【多线程】iOS 多线程：「RunLoop」详尽总结

> 本文用来介绍 iOS 多线程中，RunLoop 的相关知识。主要包括如下内容：
>
> 1. RunLoop 简介
>
> 2. RunLoop 相关类
>
> 3. RunLoop 原理
>
> 4. RunLoop 实战应用
>
> 文中 Demo 地址：[YSC-RunLoopDemo](https://github.com/itcharge/YSC-RunLoopDemo)


## 1. RunLoop 简介

### 1.1 什么是 RunLoop？

可以理解为字面意思：Run 表示运行，Loop 表示循环。结合在一起就是运行的循环的意思。哈哈，我更愿意翻译为「跑圈」。直观理解就像是不停的跑圈。

RunLoop 实际上是一个对象，这个对象在循环中用来处理程序运行过程中出现的各种事件（比如说触摸事件、UI 刷新事件、定时器事件、Selector 事件），从而保持程序的持续运行；而且在没有事件处理的时候，会进入睡眠模式，从而节省 CPU 资源，提高程序性能。

### 1.2 RunLoop 和线程
RunLoop 和线程是息息相关的，我们知道线程的作用是用来执行特定的一个或多个任务，但是在默认情况下，线程执行完之后就会退出，就不能再执行任务了。这时我们就需要采用一种方式来让线程能够处理任务，并不退出。所以，我们就有了 RunLoop。

1. 一条线程对应一个 RunLoop 对象，每条线程都有唯一一个与之对应的 RunLoop 对象。
2. 我们只能在当前线程中操作当前线程的 RunLoop，而不能去操作其他线程的 RunLoop。
3. RunLoop 对象在第一次获取 RunLoop 时创建，销毁则是在线程结束的时候。
4. 主线程的 RunLoop 对象系统自动帮助我们创建好了（原理如下），而子线程的 RunLoop 对象需要我们主动创建。

### 1.3 默认情况下主线程的 RunLoop 原理
我们在启动一个 iOS 程序的时候，系统会调用创建项目时自动生成的 main.m 的文件。main.m 文件如下所示：

```objc
int main(int argc, char * argv[]) {
    @autoreleasepool {
        return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
    }
}
```

其中`UIApplicationMain`函数内部帮我们开启了主线程的 RunLoop，`UIApplicationMain`内部拥有一个无线循环的代码。上边的代码中开启 RunLoop 的过程可以简单的理解为如下代码：

```objc
int main(int argc, char * argv[]) {        
    BOOL running = YES;
    do {
        // 执行各种任务，处理各种事件
        // ......
    } while (running);

    return 0;
}
```

从上边可看出，程序一直在 do-while 循环中执行，所以 UIApplicationMain 函数一直没有返回，我们在运行程序之后程序不会马上退出，会保持持续运行状态。

下图是苹果官方给出的 RunLoop 模型图。

[官方 RunLoop 模型图](https://qcdn.itcharge.cn/images/iOS-Complete-learning-RunLoop-001.jpg)

从上图中可以看出，RunLoop 就是线程中的一个循环，RunLoop 在循环中会不断检测，通过 Input sources（输入源）和 Timer sources（定时源）两种来源等待接受事件；然后对接受到的事件通知线程进行处理，并在没有事件的时候进行休息。

## 2. RunLoop 相关类

下面我们来了解一下 Core Foundation 框架下关于 RunLoop 的 5 个类，只有弄懂这几个类的含义，我们才能深入了解 RunLoop 运行机制。

1. CFRunLoopRef：代表 RunLoop 的对象
2. CFRunLoopModeRef：RunLoop 的运行模式
3. CFRunLoopSourceRef：就是 RunLoop 模型图中提到的输入源/事件源
4. CFRunLoopTimerRef：就是 RunLoop 模型图中提到的定时源
5. CFRunLoopObserverRef：观察者，能够监听 RunLoop 的状态改变

下边详细讲解下几种类的具体含义和关系。

先来看一张表示这 5 个类的关系图（来源：[https://blog.ibireme.com/2015/05/18/runloop/](https://blog.ibireme.com/2015/05/18/runloop/)）。

[](https://qcdn.itcharge.cn/images/iOS-Complete-learning-RunLoop-002.png)

接着来讲解这 5 个类的相互关系（来源：[https://blog.ibireme.com/2015/05/18/runloop/](https://blog.ibireme.com/2015/05/18/runloop/)），这篇文章总结的特别好，就拿来参考一下，有兴趣的朋友可以去看看，写的很好。

一个 RunLoop 对象（CFRunLoopRef）中包含若干个运行模式（CFRunLoopModeRef）。而每一个运行模式下又包含若干个输入源（CFRunLoopSourceRef）、定时源（CFRunLoopTimerRef）、观察者（CFRunLoopObserverRef）。

- 每次 RunLoop 启动时，只能指定其中一个运行模式（CFRunLoopModeRef），这个运行模式（CFRunLoopModeRef）被称作 CurrentMode。
- 如果需要切换运行模式（CFRunLoopModeRef），只能退出 Loop，再重新指定一个运行模式（CFRunLoopModeRef）进入。
- 这样做主要是为了分隔开不同组的输入源（CFRunLoopSourceRef）、定时源（CFRunLoopTimerRef）、观察者（CFRunLoopObserverRef），让其互不影响 。

下边我们来详细讲解下这五个类：

### 2.1 CFRunLoopRef

CFRunLoopRef 就是 Core Foundation 框架下 RunLoop 对象类。我们可通过以下方式来获取 RunLoop 对象：

- Core Foundation
 - `CFRunLoopGetCurrent(); // 获得当前线程的 RunLoop 对象`
 - `CFRunLoopGetMain(); // 获得主线程的 RunLoop 对象`

当然，在 Foundation 框架下获取 RunLoop 对象类的方法如下：

- Foundation
 - `[NSRunLoop currentRunLoop]; // 获得当前线程的 RunLoop 对象`
 - `[NSRunLoop mainRunLoop]; // 获得主线程的 RunLoop 对象`

### 2.2 CFRunLoopModeRef

系统默认定义了多种运行模式（CFRunLoopModeRef），如下：

1. **kCFRunLoopDefaultMode**：App 的默认运行模式，通常主线程是在这个运行模式下运行
2. **UITrackingRunLoopMode**：跟踪用户交互事件（用于 ScrollView 追踪触摸滑动，保证界面滑动时不受其他 Mode 影响）
3. UIInitializationRunLoopMode：在刚启动 App 时第进入的第一个 Mode，启动完成后就不再使用
4. GSEventReceiveRunLoopMode：接受系统内部事件，通常用不到
5. **kCFRunLoopCommonModes**：伪模式，不是一种真正的运行模式（后边会用到）

其中**kCFRunLoopDefaultMode**、**UITrackingRunLoopMode**、**kCFRunLoopCommonModes**是我们开发中需要用到的模式，具体使用方法我们在 **2.3 CFRunLoopTimerRef** 中结合 CFRunLoopTimerRef 来演示说明。

### 2.3 CFRunLoopTimerRef

CFRunLoopTimerRef 是定时源（RunLoop 模型图中提到过），理解为基于时间的触发器，基本上就是 NSTimer（哈哈，这个理解就简单了吧）。

下面我们来演示下 CFRunLoopModeRef 和 CFRunLoopTimerRef 结合的使用用法，从而加深理解。

1. 首先我们新建一个 iOS 项目，在 Main.storyboard 中拖入一个 Text View。
2. 在 ViewController.m 文件中加入以下代码，[Demo](https://github.com/lianai911/YSC-RunLoopDemo)中请调用`[self ShowDemo1];`来演示。

 ```objc
  - (void)viewDidLoad {
      [super viewDidLoad];
  
      // 定义一个定时器，约定两秒之后调用 self 的 run 方法
      NSTimer *timer = [NSTimer timerWithTimeInterval:2.0 target:self selector:@selector(run) userInfo:nil repeats:YES];
  
      // 将定时器添加到当前 RunLoop 的 NSDefaultRunLoopMode 下
      [[NSRunLoop currentRunLoop] addTimer:timer forMode:NSDefaultRunLoopMode];
  }
  
  - (void)run
  {
      NSLog(@"---run");
  }
  ```
3. 然后运行，这时候我们发现如果我们不对模拟器进行任何操作的话，定时器会稳定的每隔 2 秒调用 run 方法打印。

4. 但是当我们拖动 Text View 滚动时，我们发现：run 方法不打印了，也就是说 NSTimer 不工作了。而当我们松开鼠标的时候，NSTimer 就又开始正常工作了。

这是因为：
 - 当我们不做任何操作的时候，RunLoop 处于 NSDefaultRunLoopMode 下。
 - 而当我们拖动 Text View 的时候，RunLoop 就结束 NSDefaultRunLoopMode，切换到了 UITrackingRunLoopMode 模式下，这个模式下没有添加 NSTimer，所以我们的 NSTimer 就不工作了。
 - 但当我们松开鼠标的时候，RunLoop 就结束 UITrackingRunLoopMode 模式，又切换回 NSDefaultRunLoopMode 模式，所以 NSTimer 就又开始正常工作了。

你可以试着将上述代码中的`[[NSRunLoop currentRunLoop] addTimer:timer forMode:NSDefaultRunLoopMode];`语句换为`[[NSRunLoop currentRunLoop] addTimer:timer forMode:UITrackingRunLoopMode];`，也就是将定时器添加到当前 RunLoop 的 UITrackingRunLoopMode 下，你就会发现定时器只会在拖动 Text View 的模式下工作，而不做操作的时候定时器就不工作。

那难道我们就不能在这两种模式下让 NSTimer 都能正常工作吗？

当然可以，这就用到了我们之前说过的**伪模式（kCFRunLoopCommonModes）**，这其实不是一种真实的模式，而是一种标记模式，意思就是可以在打上 Common Modes 标记的模式下运行。

那么哪些模式被标记上了 Common Modes 呢？

**NSDefaultRunLoopMode** 和 **UITrackingRunLoopMode**。

所以我们只要我们将 NSTimer 添加到当前 RunLoop 的 kCFRunLoopCommonModes（Foundation 框架下为 NSRunLoopCommonModes）下，我们就可以让 NSTimer 在不做操作和拖动 Text View 两种情况下愉快的正常工作了。

具体做法就是讲添加语句改为`[[NSRunLoop currentRunLoop] addTimer:timer forMode:NSRunLoopCommonModes];`

既然讲到了 NSTimer，这里顺便讲下 NSTimer 中的`scheduledTimerWithTimeInterval`方法和 RunLoop 的关系。添加下面的代码：

```objc
[NSTimer scheduledTimerWithTimeInterval:2.0 target:self selector:@selector(run) userInfo:nil repeats:YES];
```

这句代码调用了 scheduledTimer 返回的定时器，NSTimer 会自动被加入到了 RunLoop 的 NSDefaultRunLoopMode 模式下。这句代码相当于下面两句代码：

```objc
NSTimer *timer = [NSTimer timerWithTimeInterval:2.0 target:self selector:@selector(run) userInfo:nil repeats:YES];
[[NSRunLoop currentRunLoop] addTimer:timer forMode:NSDefaultRunLoopMode];
```

### 2.4 CFRunLoopSourceRef

CFRunLoopSourceRef 是事件源（RunLoop 模型图中提到过），CFRunLoopSourceRef 有两种分类方法。

- 第一种按照官方文档来分类（就像 RunLoop 模型图中那样）：
 - Port-Based Sources（基于端口）
 - Custom Input Sources（自定义）
 - Cocoa Perform Selector Sources
- 第二种按照函数调用栈来分类：
 - Source0 ：非基于 Port
 - Source1：基于 Port，通过内核和其他线程通信，接收、分发系统事件

这两种分类方式其实没有区别，只不过第一种是通过官方理论来分类，第二种是在实际应用中通过调用函数来分类。

下边我们举个例子大致来了解一下函数调用栈和 Source。

1. 在我们的项目中的 Main.storyboard 中添加一个 Button 按钮，并添加点击动作。
2. 然后在点击动作的代码中加入一句输出语句，并打上断点，如下图所示：

 [添加 Button.png](https://qcdn.itcharge.cn/images/iOS-Complete-learning-RunLoop-003.png)

3. 然后运行程序，并点击按钮。
4. 然后在项目中单击下下图红色部分。

 [函数调用栈展示图](https://qcdn.itcharge.cn/images/iOS-Complete-learning-RunLoop-004.png)

5. 可以看到如下图所示就是点击事件产生的函数调用栈。

 [函数调用栈](https://qcdn.itcharge.cn/images/iOS-Complete-learning-RunLoop-005.png)

所以点击事件是这样来的：

1. 首先程序启动，调用 16 行的 main 函数，main 函数调用 15 行 UIApplicationMain 函数，然后一直往上调用函数，最终调用到 0 行的 BtnClick 函数，即点击函数。

2. 同时我们可以看到 11 行中有 Sources0，也就是说我们点击事件是属于 Sources0 函数的，点击事件就是在 Sources0 中处理的。

3. 而至于 Sources1，则是用来接收、分发系统事件，然后再分发到 Sources0 中处理的。

### 2.5 CFRunLoopObserverRef

CFRunLoopObserverRef 是观察者，用来监听 RunLoop 的状态改变 

CFRunLoopObserverRef 可以监听的状态改变有以下几种：

```objc
typedef CF_OPTIONS(CFOptionFlags, CFRunLoopActivity) {
    kCFRunLoopEntry = (1UL << 0),               // 即将进入 Loop：1
    kCFRunLoopBeforeTimers = (1UL << 1),        // 即将处理 Timer：2    
    kCFRunLoopBeforeSources = (1UL << 2),       // 即将处理 Source：4
    kCFRunLoopBeforeWaiting = (1UL << 5),       // 即将进入休眠：32
    kCFRunLoopAfterWaiting = (1UL << 6),        // 即将从休眠中唤醒：64
    kCFRunLoopExit = (1UL << 7),                // 即将从 Loop 中退出：128
    kCFRunLoopAllActivities = 0x0FFFFFFFU       // 监听全部状态改变  
};
```
下边我们通过代码来监听下 RunLoop 中的状态改变。

1. 在 ViewController.m 中添加如下代码，[Demo](https://github.com/lianai911/YSC-RunLoopDemo)中请调用`[self showDemo2];`方法。

 ```objc
  - (void)viewDidLoad {
      [super viewDidLoad];

      // 创建观察者
      CFRunLoopObserverRef observer = CFRunLoopObserverCreateWithHandler(CFAllocatorGetDefault(), kCFRunLoopAllActivities, YES, 0, ^(CFRunLoopObserverRef observer, CFRunLoopActivity activity) {
          NSLog(@"监听到 RunLoop 发生改变---%zd",activity);
      });

      // 添加观察者到当前 RunLoop 中
      CFRunLoopAddObserver(CFRunLoopGetCurrent(), observer, kCFRunLoopDefaultMode);

      // 释放 observer，最后添加完需要释放掉
      CFRelease(observer);
  }
  ```

2. 然后运行，看下打印结果，如下图。

[打印结果](https://qcdn.itcharge.cn/images/iOS-Complete-learning-RunLoop-006.png)

可以看到 RunLoop 的状态在不断的改变，最终变成了状态 32，也就是即将进入睡眠状态，说明 RunLoop 之后就会进入睡眠状态。

## 3. RunLoop 原理

好了，五个类都讲解完了，下边开始放大招了。这下我们就可以来理解 RunLoop 的运行逻辑了。

下边上一张之前提到的文章中博主提供的运行逻辑图（来源：https://blog.ibireme.com/2015/05/18/runloop/）

[RunLoop 运行逻辑图](https://qcdn.itcharge.cn/images/iOS-Complete-learning-RunLoop-007.png)

这张图对于我们理解 RunLoop 来说太有帮助了，下边我们可以来说下官方文档给我们的 RunLoop 逻辑。

在每次运行开启 RunLoop 的时候，所在线程的 RunLoop 会自动处理之前未处理的事件，并且通知相关的观察者。

具体的顺序如下：

1. 通知观察者 RunLoop 已经启动
2. 通知观察者即将要开始的定时器
3. 通知观察者任何即将启动的非基于端口的源
4. 启动任何准备好的非基于端口的源
5. 如果基于端口的源准备好并处于等待状态，立即启动；并进入步骤 9
6. 通知观察者线程进入休眠状态
7. 将线程置于休眠知道任一下面的事件发生：
 - 某一事件到达基于端口的源
 - 定时器启动
 - RunLoop 设置的时间已经超时
 - RunLoop 被显示唤醒
8. 通知观察者线程将被唤醒
9. 处理未处理的事件
 - 如果用户定义的定时器启动，处理定时器事件并重启 RunLoop。进入步骤 2
 - 如果输入源启动，传递相应的消息
 - 如果 RunLoop 被显示唤醒而且时间还没超时，重启 RunLoop。进入步骤 2
10. 通知观察者 RunLoop 结束。

## 4. RunLoop 实战应用

哈哈，讲了这么多云里雾里的原理知识，下边终于到了实战应用环节。

光弄懂是没啥用的，能够实战应用才是硬道理。下面讲解一下 RunLoop 的几种应用。

### 4.1 NSTimer 的使用

NSTimer 的使用方法在讲解`CFRunLoopTimerRef`类的时候详细讲解过，具体参考上边 **2.3 CFRunLoopTimerRef**。

### 4.2 ImageView 推迟显示

有时候，我们会遇到这种情况：
当界面中含有 UITableView，而且每个 UITableViewCell 里边都有图片。这时候当我们滚动 UITableView 的时候，如果有一堆的图片需要显示，那么可能会出现卡顿的现象。

怎么解决这个问题呢？

这时候，我们应该推迟图片的显示，也就是 ImageView 推迟显示图片。有两种方法：
#### 1. 监听 UIScrollView 的滚动
因为 UITableView 继承自 UIScrollView，所以我们可以通过监听 UIScrollView 的滚动，实现 UIScrollView 相关 delegate 即可。
#### 2. 利用 PerformSelector 设置当前线程的 RunLoop 的运行模式
利用`performSelector`方法为 UIImageView 调用`setImage:`方法，并利用`inModes`将其设置为 RunLoop 下 NSDefaultRunLoopMode 运行模式。代码如下：

```objc
[self.imageView performSelector:@selector(setImage:) withObject:[UIImage imageNamed:@"tupian"] afterDelay:4.0 inModes:NSDefaultRunLoopMode];
```

下边利用 Demo 演示一下该方法。
1. 在项目中的 Main.storyboard 中添加一个 UIImageView，并添加属性，并简单添加一下约束（不然无法显示）如下图所示。

 [添加 UIImageView](https://qcdn.itcharge.cn/images/iOS-Complete-learning-RunLoop-008.png)

2. 在项目中拖入一张图片，比如下图。

 [tupian.jpg](https://qcdn.itcharge.cn/images/iOS-Complete-learning-RunLoop-009.jpg)

3. 然后我们在`touchesBegan`方法中添加下面的代码，在[Demo](https://github.com/lianai911/YSC-RunLoopDemo)中请在`touchesBegan`中调用`[self showDemo3];`方法。
 ```objc
  - (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
  {
      [self.imageView performSelector:@selector(setImage:) withObject:[UIImage imageNamed:@"tupian"] afterDelay:4.0 inModes:@[NSDefaultRunLoopMode]];
  }
  ```
4. 运行程序，点击一下屏幕，然后拖动 UIText View，拖动 4 秒以上，发现过了 4 秒之后，UIImageView 还没有显示图片，当我们松开的时候，则显示图片，效果如下：

[UIImageView 延迟显示效果.gif](https://qcdn.itcharge.cn/images/iOS-Complete-learning-RunLoop-010.gif)

这样我们就实现了在拖动完之后，在延迟显示 UIImageView。

### 4.3 后台常驻线程（很常用）

我们在开发应用程序的过程中，如果后台操作特别频繁，经常会在子线程做一些耗时操作（下载文件、后台播放音乐等），我们最好能让这条线程永远常驻内存。

那么怎么做呢？

添加一条用于常驻内存的强引用的子线程，在该线程的 RunLoop 下添加一个 Sources，开启 RunLoop。

具体实现过程如下：

1. 在项目的 ViewController.m 中添加一条强引用的 thread 线程属性，如下图：

 [添加 thread 属性](https://qcdn.itcharge.cn/images/iOS-Complete-learning-RunLoop-011.png)

2. 在 viewDidLoad 中创建线程 self.thread，使线程启动并执行 run1 方法，代码如下。在[Demo](https://github.com/lianai911/YSC-RunLoopDemo)中，请在 viewDidLoad 调用`[self showDemo4];`方法。

 ```objc
  - (void)viewDidLoad {
      [super viewDidLoad];

      // 创建线程，并调用 run1 方法执行任务
      self.thread = [[NSThread alloc] initWithTarget:self selector:@selector(run1) object:nil];
      // 开启线程
      [self.thread start];    
  }

  - (void) run1
  {
      // 这里写任务
      NSLog(@"----run1-----");

      // 添加下边两句代码，就可以开启 RunLoop，之后 self.thread 就变成了常驻线程，可随时添加任务，并交于 RunLoop 处理
      [[NSRunLoop currentRunLoop] addPort:[NSPort port] forMode:NSDefaultRunLoopMode];
      [[NSRunLoop currentRunLoop] run];

      // 测试是否开启了 RunLoop，如果开启 RunLoop，则来不了这里，因为 RunLoop 开启了循环。
      NSLog(@"未开启 RunLoop");
  }
  ```

3. 运行之后发现打印了**----run1-----**，而**未开启 RunLoop**则未打印。

这时，我们就开启了一条常驻线程，下边我们来试着添加其他任务，除了之前创建的时候调用了 run1 方法，我们另外在点击的时候调用 run2 方法。

那么，我们在 touchesBegan 中调用 PerformSelector，从而实现在点击屏幕的时候调用 run2 方法。[Demo 地址](https://github.com/lianai911/YSC-RunLoopDemo)。具体代码如下：

```objc
- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{   
    // 利用 performSelector，在 self.thread 的线程中调用 run2 方法执行任务
    [self performSelector:@selector(run2) onThread:self.thread withObject:nil waitUntilDone:NO];
}

- (void) run2
{
    NSLog(@"----run2------");
}
```

经过运行测试，除了之前打印的**----run1-----**，每当我们点击屏幕，都能调用**----run2------**。
这样我们就实现了常驻线程的需求。
