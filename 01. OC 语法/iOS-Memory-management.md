---
title: OC 知识：彻底理解内存管理（MRC、ARC）
date: 2016-07-30 15:00:37
tags:
    - 技术
    - iOS 开发
categories:
    - 00 - 技术 - iOS 开发
---



> 本文用来对 Objective-C 语法中，内存管理（MRC、ARC）相关知识进行讲解。

<!--more-->

## 1. 什么是内存管理

- 程序在运行的过程中通常通过以下行为，来增加程序的的内存占用
    - 创建一个OC对象
    - 定义一个变量
    - 调用一个函数或者方法
- 而一个移动设备的内存是有限的，每个软件所能占用的内存也是有限的
- 当程序所占用的内存较多时，系统就会发出内存警告，这时就得回收一些不需要再使用的内存空间。比如回收一些不需要使用的对象、变量等
- 如果程序占用内存过大，系统可能会强制关闭程序，造成程序崩溃、闪退现象，影响用户体验

> 所以，我们需要对内存进行合理的分配内存、清除内存，回收那些不需要再使用的对象。从而保证程序的稳定性。

那么，那些对象才需要我们进行内存管理呢？

- 任何继承了NSObject的对象需要进行内存管理
- 而其他非对象类型(int、char、float、double、struct、enum等) 不需要进行内存管理

这是因为

- 继承了NSObject的对象的存储在操作系统的`堆`里边。
- 操作系统的`堆`：一般由程序员分配释放，若程序员不释放，程序结束时可能由OS回收，分配方式类似于链表
- 非OC对象一般放在操作系统的`栈`里面
- 操作系统的`栈`：由操作系统自动分配释放，存放函数的参数值，局部变量的值等。其操作方式类似于数据结构中的栈(先进后出) 
- 示例：

```objc
int main(int argc, const char * argv[])
{
    @autoreleasepool {
        int a = 10; // 栈
        int b = 20; // 栈
        // p : 栈
        // Person对象(计数器==1) : 堆
        Person *p = [[Person alloc] init];
    }
    // 经过上面代码后, 栈里面的变量a、b、p 都会被回收
    // 但是堆里面的Person对象还会留在内存中,因为它是计数器依然是1
    return 0;
}
```

![图片1.png](http://qncdn.bujige.net/images/iOS-Memory-management-001.png)

***

## 2. 内存管理模型

提供给Objective-C程序员的基本内存管理模型有以下3种：

- 自动垃圾收集（iOS运行环境不支持）
- 手工引用计数和自动释放池(MRC)
- 自动引用计数(ARC)

***

## 3.MRC 手动管理内存(Manual Reference Counting)

### 1. 引用计数器

系统是根据对象的引用计数器来判断什么时候需要回收一个对象所占用的内存

- 引用计数器是一个整数
- 从字面上, 可以理解为”对象被引用的次数”
- 也可以理解为: 它表示有多少人正在用这个对象
- 每个OC对象都有自己的引用计数器
- 任何一个对象，刚创建的时候，初始的引用计数为1
    - 当使用alloc、new或者copy创建一个对象时，对象的引用计数器默认就是1
- 当没有任何人使用这个对象时，系统才会回收这个对象, 也就是说
    - 当对象的引用计数器为0时，对象占用的内存就会被系统回收
    - 如果对象的计数器不为0，那么在整个程序运行过程，它占用的内存就不可能被回收(除非整个程序已经退出 )

### 2. 引用计数器操作

- 为保证对象的存在，每当创建引用到对象需要给对象发送一条retain消息，可以使引用计数器值+1 ( retain 方法返回对象本身)
- 当不再需要对象时，通过给对象发送一条release消息，可以使引用计数器值-1
- 给对象发送retainCount消息，可以获得当前的引用计数器值
- 当对象的引用计数为0时，系统就知道这个对象不再需要使用了，所以可以释放它的内存，通过给对象发送dealloc消息发起这个过程。
- 需要注意的是：release并不代表销毁\回收对象，仅仅是计数器-1

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // 只要创建一个对象默认引用计数器的值就是1
        Person *p = [[Person alloc] init];
        NSLog(@"retainCount = %lu", [p retainCount]); // 1

        // 只要给对象发送一个retain消息, 对象的引用计数器就会+1
        [p retain];

        NSLog(@"retainCount = %lu", [p retainCount]); // 2
        // 通过指针变量p,给p指向的对象发送一条release消息
        // 只要对象接收到release消息, 引用计数器就会-1
        // 只要一个对象的引用计数器为0, 系统就会释放对象

        [p release];
        // 需要注意的是: release并不代表销毁\回收对象, 仅仅是计数器-1
        NSLog(@"retainCount = %lu", [p retainCount]); // 1

        [p release]; // 0
        NSLog(@"--------");
    }
//    [p setAge:20];    // 此时对象已经被释放
    return 0;
}
```

### 3. dealloc方法

- 当一个对象的引用计数器值为0时，这个对象即将被销毁，其占用的内存被系统回收
- 对象即将被销毁时系统会自动给对象发送一条dealloc消息(因此，从dealloc方法有没有被调用,就可以判断出对象是否被销毁)
- dealloc方法的重写
    - 一般会重写dealloc方法，在这里释放相关资源，dealloc就是对象的遗言
    - 一旦重写了dealloc方法，就必须调用[super dealloc]，并且放在最后面调用

```objc
- (void)dealloc
{
    NSLog(@"Person dealloc");
    // 注意:super dealloc一定要写到所有代码的最后
    // 一定要写在dealloc方法的最后面
    [super dealloc]; 
}
```

- 使用注意
    - 不能直接调用dealloc方法
    - 一旦对象被回收了, 它占用的内存就不再可用，坚持使用会导致程序崩溃（野指针错误）

### 4. 野指针和空指针

- 只要一个对象被释放了，我们就称这个对象为 "僵尸对象(不能再使用的对象)"
- 当一个指针指向一个僵尸对象(不可用内存)，我们就称这个指针为野指针
- 只要给一个野指针发送消息就会报错(EXC_BAD_ACCESS错误)

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        Person *p = [[Person alloc] init]; // 执行完引用计数为1       

        [p release]; // 执行完引用计数为0，实例对象被释放
        [p release]; // 此时，p就变成了野指针，再给野指针p发送消息就会报错
        [p release];
    }
    return 0;
}
```

- 为了避免给野指针发送消息会报错，一般情况下，当一个对象被释放后我们会将这个对象的指针设置为空指针
- 空指针
    - 没有指向存储空间的指针(里面存的是nil, 也就是0)
    - 给空指针发消息是没有任何反应的

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        Person *p = [[Person alloc] init]; // 执行完引用计数为1

        [p release]; // 执行完引用计数为0，实例对象被释放
        p = nil; // 此时，p变为了空指针
        [p release]; // 再给空指针p发送消息就不会报错了
        [p release];
    }
    return 0;
}
```

### 5. 内存管理规律

#### 单个对象内存管理规律

- 谁创建谁release :
    - 如果你通过alloc、new、copy或mutableCopy来创建一个对象，那么你必须调用release或autorelease
- 谁retain谁release:
    - 只要你调用了retain，就必须调用一次release
- 总结一下就是
    - 有加就有减
    - 曾经让对象的计数器+1，就必须在最后让对象计数器-1

#### 多个对象内存管理规律

因为多个对象之间往往是联系的，所以管理起来比较复杂。这里用一个玩游戏例子来类比一下。

游戏可以提供给玩家(A类对象) 游戏房间(B类对象)来玩游戏。

- 只要一个玩家想使用房间(进入房间)，就需要对这个房间的引用计数器+1
- 只要一个玩家不想再使用房间(离开房间)，就需要对这个房间的引用计数器-1
- 只要还有至少一个玩家在用某个房间，那么这个房间就不会被回收，引用计数至少为1

![图片2.png](http://qncdn.bujige.net/images/iOS-Memory-management-002.png)
下面来定义两个类 玩家类：Person 和 房间类：Room

房间类：Room，房间类中有房间号
```objc
#import <Foundation/Foundation.h>

@interface Room : NSObject
@property int no; // 房间号
@end
```

玩家类：Person
```objc
#import <Foundation/Foundation.h>
#import "Room.h"

@interface Person : NSObject
{
    Room *_room;
}

- (void)setRoom:(Room *)room;

- (Room *)room;
@end
```

现在我们通过几个玩家使用房间的不同应用场景来逐步深入理解内存管理。

#### 1. 玩家没有使用房间，玩家和房间之间没有联系的情况

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // 1.创建两个对象
        Person *p = [[Person alloc] init];    // 玩家 p
        Room *r = [[Room alloc] init];        // 房间 r
        r.no = 888;    // 房间号赋值

        [r release];    // 释放房间      
        [p release];   // 释放玩家
    }
    return 0;
}
```

上述代码执行完前3行
```objc
        // 1.创建两个对象
        Person *p = [[Person alloc] init];    // 玩家 p
        Room *r = [[Room alloc] init];        // 房间 r
        r.no = 888;    // 房间号赋值
```

之后在内存中的表现如下图所示：

![图片3.png](http://qncdn.bujige.net/images/iOS-Memory-management-003.png)

可见，Room实例对象和Person实例对象之间没有相互联系，所以各自释放不会报错。执行完4、5行代码

```objc
        [r release];    // 释放房间      
        [p release];   // 释放玩家
```

后，将房间对象和玩家对象各自释放掉，在内存中的表现如下图所示：

![图片4.png](http://qncdn.bujige.net/images/iOS-Memory-management-004.png)

最后各自实例对象的内存就会被系统回收

#### 2. 一个玩家使用一个游戏房间，玩家和房间之间相关联的情况

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // 1.创建两个对象
        Person *p = [[Person alloc] init];    // 玩家 p
        Room *r = [[Room alloc] init];        // 房间 r
        r.no = 888;    // 房间号赋值
     
        // 将房间赋值给玩家，表示玩家在使用房间
        // 玩家需要使用这间房，只要玩家在，房间就一定要在
        p.room = r; // [p setRoom:r]
     
        [r release];    // 释放房间
       
        // 在这行代码之前，玩家都没有被释放，但是因为玩家还在，那么房间就不能销毁
        NSLog(@"-----");
       
        [p release];    // 释放玩家
    }
    return 0;
}
```

上边代码执行完前3行的时候和之前在内存中的表现一样，如图

![图片3.png](http://qncdn.bujige.net/images/iOS-Memory-management-005.png)

当执行完第4行代码`p.room = r;`时，因为调用了setter方法，将Room实例对象赋值给了Person的成员变量，不做其他设置的话，在内存中的表现如下图(做法不对)：

![图片5.png](http://qncdn.bujige.net/images/iOS-Memory-management-006.png)

在调用setter方法的时候，因为Room实例对象多了一个Person对象引用，所以应将Room实例对象的引用计数+1才对，即setter方法应该像下边一样，对room进行一次retain操作。

```objc
- (void)setRoom:(Room *)room // room = r
{
    // 对房间的引用计数器+1
    [room retain];
    _room = room;
}
```

那么执行完第4行代码`p.room = r;`，在内存中的表现为：

![图片6.png](http://qncdn.bujige.net/images/iOS-Memory-management-007.png)

继续执行第5行代码`[r release];`，释放房间，Room实例对象引用计数-1，在内存中的表现如下图所示：

![图片5.png](http://qncdn.bujige.net/images/iOS-Memory-management-008.png)

然后执行第6行代码`[p release];`，释放玩家。这时候因为玩家不在房间里了，房间也没有用了，所以在释放玩家的时候，要把房间也释放掉，也就是在delloc里边对房间再进行一次release操作。

这样对房间对象来说，每一次retain/alloc操作都对应一次release操作。

```objc
- (void)dealloc
{
    // 人释放了, 那么房间也需要释放
    [_room release];
    NSLog(@"%s", __func__);

    [super dealloc];
}
```

那么在内存中的表现最终如下图所示：

![图片7.png](http://qncdn.bujige.net/images/iOS-Memory-management-009.png)

最后实例对象的内存就会被系统回收

#### 3. 一个玩家使用一个游戏房间r后，换到另一个游戏房间r2，玩家和房间相关联的情况

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // 1.创建两个对象
        Person *p = [[Person alloc] init];    // 玩家 p
        Room *r = [[Room alloc] init];        // 房间 r
        r.no = 888;    // 房间号赋值          

        // 2.将房间赋值给玩家，表示玩家在使用房间
        p.room = r; // [p setRoom:r]
        [r release];    // 释放房间 r

        // 3. 换房
        Room *r2 = [[Room alloc] init];
        r2.no = 444;
        p.room = r2;
        [r2 release];    // 释放房间 r2
     
        [p release];    // 释放玩家 p
    }
    return 0;
}
```

执行下边几行代码

```objc
        // 1.创建两个对象
        Person *p = [[Person alloc] init];    // 玩家 p
        Room *r = [[Room alloc] init];        // 房间 r
        r.no = 888;    // 房间号赋值          

        // 2.将房间赋值给玩家，表示玩家在使用房间
        p.room = r; // [p setRoom:r]
        [r release];    // 释放房间 r
```

之后的内存表现为：

![图片8.png](http://qncdn.bujige.net/images/iOS-Memory-management-010.png)

接着执行换房操作而不进行其他操作的话，

```objc
        // 3. 换房
        Room *r2 = [[Room alloc] init];
        r2.no = 444;
        p.room = r2;
```

内存的表现为：

![图片9.png](http://qncdn.bujige.net/images/iOS-Memory-management-011.png)

最后执行完

```objc
        [r2 release];    // 释放房间 r2
        [p release];    // 释放玩家 p
```

内存的表现为：

![图片10.png](http://qncdn.bujige.net/images/iOS-Memory-management-012.png)

可以看出房间 r 并没有被释放，这是因为在进行换房的时候，并没有对房间 r 进行释放。所以应在调用setter方法的时候，对之前的变量进行一次release操作。具体setter方法代码如下：

```objc
- (void)setRoom:(Room *)room // room = r
{
        // 将以前的房间释放掉 -1
        [_room release];     

        // 对房间的引用计数器+1
        [room retain];

        _room = room;
    }
}
```

这样在执行完`p.room = r2;`之后就会将 房间 r 释放掉，最终内存表现为：

![图片11.png](http://qncdn.bujige.net/images/iOS-Memory-management-013.png)


#### 4. 一个玩家使用一个游戏房间，不再使用游戏房间，将游戏房间释放掉之后，再次使用该游戏房间的情况

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // 1.创建两个对象
        Person *p = [[Person alloc] init];
        Room *r = [[Room alloc] init];
        r.no = 888;

        // 2.将房间赋值给人
        p.room = r; // [p setRoom:r]
        [r release];    // 释放房间 r  
        
        // 3.再次使用房间 r
        p.room = r;
        [r release];    // 释放房间 r  
        [p release];    // 释放玩家 p
    }
    return 0;
}
```

执行下面代码

```objc
        // 1.创建两个对象
        Person *p = [[Person alloc] init];
        Room *r = [[Room alloc] init];
        r.no = 888;

        // 2.将房间赋值给人
        p.room = r; // [p setRoom:r]
        [r release];    // 释放房间 r  
```

之后的内存表现为：


![图片12.png](http://qncdn.bujige.net/images/iOS-Memory-management-014.png)

然后再执行` p.room = r; `，因为setter方法会将之前的Room实例对象先release掉，此时内存表现为：

![图片13.png](http://qncdn.bujige.net/images/iOS-Memory-management-015.png)

此时_room、r 已经变成了一个野指针。之后再对野指针 r 发出retain消息，程序就会崩溃。所以我们在进行setter方法的时候，要先判断一下是否是重复赋值，如果是同一个实例对象，就不需要重复进行release和retain。换句话说，如果我们使用的还是之前的房间，那换房的时候就不需要对这个房间再进行release和retain。则setter方法具体代码如下：

```objc
- (void)setRoom:(Room *)room // room = r
{
    // 只有房间不同才需用release和retain
    if (_room != room) {    // 0ffe1 != 0ffe1
        // 将以前的房间释放掉 -1
        [_room release];

        // 对房间的引用计数器+1
        [room retain];

        _room = room;
    }
}
```

因为retain不仅仅会对引用计数器+1, 而且还会返回当前对象，所以上述代码可最终简化成：

```objc
- (void)setRoom:(Room *)room // room = r
{
    // 只有房间不同才需用release和retain
    if (_room != room) {    // 0ffe1 != 0ffe1
        // 将以前的房间释放掉 -1
        [_room release];      

        _room = [room retain];
    }
}
```

以上就是setter方法的最终形式。

### 6. @property参数

- 在成员变量前加上@property，系统就会自动帮我们生成基本的setter/getter方法

```objc
@property (nonatomic) int val;
```

- 如果在property后边加上retain，系统就会自动帮我们生成getter/setter方法内存管理的代码，但是仍需要我们自己重写dealloc方法

```objc
@property(nonatomic, retain) Room *room;

```

- 如果在property后边加上assign，系统就不会帮我们生成set方法内存管理的代码，仅仅只会生成普通的getter/setter方法，默认什么都不写就是assign

```objc
@property(nonatomic, retain) int val;
```

### 7. 自动释放池

当我们不再使用一个对象的时候应该将其空间释放，但是有时候我们不知道何时应该将其释放。为了解决这个问题，Objective-C提供了autorelease方法。

- autorelease是一种支持引用计数的内存管理方式，只要给对象发送一条autorelease消息，会将对象放到一个自动释放池中，当自动释放池被销毁时，会对池子里面的`所有对象做一次release操作` 
  
    > 注意,这里只是发送release消息，如果当时的引用计数(reference-counted)依然不为0，则该对象依然不会被释放。
- autorelease方法会返回对象本身，且调用完autorelease方法后，对象的计数器不变

```objc
Person *p = [Person new];
p = [p autorelease];
NSLog(@"count = %lu", [p retainCount]); // 计数还为1
```

#### 1. 使用autorelease有什么好处呢

- 不用再关心对象释放的时间
- 不用再关心什么时候调用release

#### 2. autorelease的原理实质上是什么？

autorelease实际上只是把对release的调用延迟了，对于每一个autorelease，系统只是把该对象放入了当前的autorelease pool中,当该pool被释放时,该pool中的所有对象会被调用release。

#### 3. autorelease的创建方法

  1. 使用NSAutoreleasePool来创建

  ```objc
  NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init]; // 创建自动释放池
  [pool release]; // [pool drain]; 销毁自动释放池
  ```

  2. 使用@autoreleasepool创建

  ```objc
  @autoreleasepool
  { //开始代表创建自动释放池
  
  } //结束代表销毁自动释放池
  ```

#### 4. autorelease的使用方法

```objc
NSAutoreleasePool *autoreleasePool = [[NSAutoreleasePool alloc] init];
Person *p = [[[Person alloc] init] autorelease];
[autoreleasePool drain];
```

```objc
@autoreleasepool
{ // 创建一个自动释放池
        Person *p = [[Person new] autorelease];
        // 将代码写到这里就放入了自动释放池
} // 销毁自动释放池(会给池子中所有对象发送一条release消息)
```

#### 5. autorelease的注意事项

- 并不是放到自动释放池代码中,都会自动加入到自动释放池

```objc
@autoreleasepool {
    // 因为没有调用 autorelease 方法,所以对象没有加入到自动释放池
    Person *p = [[Person alloc] init];
    [p run];
}
```
- 在自动释放池的外部发送autorelease 不会被加入到自动释放池中
    - autorelease是一个方法,只有在自动释 放池中调用才有效。



```objc
@autoreleasepool {
}
// 没有与之对应的自动释放池, 只有在自动释放池中调用autorelease才会放到释放池
Person *p = [[[Person alloc] init] autorelease];
[p run];

// 正确写法
@autoreleasepool {
    Person *p = [[[Person alloc] init] autorelease];
 }

// 正确写法
Person *p = [[Person alloc] init];
@autoreleasepool {
    [p autorelease];
}
```

#### 6. 自动释放池的嵌套使用

- 自动释放池是以栈的形式存在
- 由于栈只有一个入口, 所以调用autorelease会将对象放到栈顶的自动释放池
> 栈顶就是离调用autorelease方法最近的自动释放池

```objc
@autoreleasepool { // 栈底自动释放池
    @autoreleasepool {
        @autoreleasepool { // 栈顶自动释放池
            Person *p = [[[Person alloc] init] autorelease];
        }
        Person *p = [[[Person alloc] init] autorelease];
    }
}
```

- 自动释放池中不适宜放占用内存比较大的对象
    - 尽量避免对大内存使用该方法,对于这种延迟释放机制,还是尽量少用
    - 不要把大量循环操作放到同一个 @autoreleasepool 之间,这样会造成内存峰值的上升

```objc
// 内存暴涨
@autoreleasepool {
    for (int i = 0; i < 99999; ++i) {
        Person *p = [[[Person alloc] init] autorelease];
    }
}
```

```objc
// 内存不会暴涨
for (int i = 0; i < 99999; ++i) {
    @autoreleasepool {
        Person *p = [[[Person alloc] init] autorelease];
    }
}
```

#### 7. autorelease错误用法

- 不要连续调用autorelease

```objc
@autoreleasepool {
 // 错误写法, 过度释放
    Person *p = [[[[Person alloc] init] autorelease] autorelease];
 }
```

- 调用autorelease后又调用release(错误)

```objc
@autoreleasepool {
    Person *p = [[[Person alloc] init] autorelease];
    [p release]; // 错误写法, 过度释放
}
```

### 8. MRC中避免循环retain

定义两个类Person类和Dog类

- Person类：

```objc
#import <Foundation/Foundation.h>
@class Dog;

@interface Person : NSObject
@property(nonatomic, retain)Dog *dog;
@end
```

- Dog类：

```objc
#import <Foundation/Foundation.h>
@class Person;

@interface Dog : NSObject
@property(nonatomic, retain)Person *owner;
@end
```

执行以下代码：

```objc
int main(int argc, const char * argv[]) {
    Person *p = [Person new];
    Dog *d = [Dog new];

    p.dog = d; // retain
    d.owner = p; // retain  assign

    [p release];
    [d release];

    return 0;
}
```

就会出现A对象要拥有B对象，而B对应又要拥有A对象，此时会形成循环retain，导致A对象和B对象永远无法释放

那么如何解决这个问题呢？

- 不要让A retain B，B retain A
- 让其中一方不要做retain操作即可
- 当两端互相引用时，应该一端用retain，一端用assign

***

## 4.ARC 自动管理内存(Automatic Reference Counting)

- Automatic Reference Counting，自动引用计数，即ARC，WWDC2011和iOS5所引入的最大的变革和最激动人心的变化。ARC是新的LLVM 3.0编译器的一项特性，使用ARC，可以说一 举解决了广大iOS开发者所憎恨的手动内存管理的麻烦。
- 使用ARC后，系统会检测出何时需要保持对象，何时需要自动释放对象，何时需要释放对象，编译器会管理好对象的内存，会在何时的地方插入retain, release和autorelease，通过生成正确的代码去自动释放或者保持对象。我们完全不用担心编译器会出错

### 1. ARC的判断原则

ARC判断一个对象是否需要释放不是通过引用计数来进行判断的，而是通过`强指针`来进行判断的。那么什么是`强指针`?

- 强指针
    - 默认所有对象的指针变量都是强指针
    - 被__strong修饰的指针

```objc
 Person *p1 = [[Person alloc] init];
 __strong  Person *p2 = [[Person alloc] init];
```

- 弱指针
    - 被__weak修饰的指针

```objc
__weak  Person *p = [[Person alloc] init];
```

ARC如何通过强指针来判断？

- 只要还有一个强指针变量指向对象，对象就会保持在内存中

### 2. ARC的使用

```objc
int main(int argc, const char * argv[]) {
    // 不用写release, main函数执行完毕后p会被自动释放
    Person *p = [[Person alloc] init];

    return 0;
}
```

### 3. ARC的注意点

- 不允许调用对象的 release方法
- 不允许调用 autorelease方法
- 重写父类的dealloc方法时，不能再调用 [super dealloc];

### 4. ARC下单对象内存管理

- 局部变量释放对象随之被释放

```objc
int main(int argc, const char * argv[]) {
   @autoreleasepool {
        Person *p = [[Person alloc] init];
    } // 执行到这一行局部变量p释放
    // 由于没有强指针指向对象, 所以对象也释放
    return 0;
}

```

- 清空指针对象随之被释放

```objc

int main(int argc, const char * argv[]) {
   @autoreleasepool {
        Person *p = [[Person alloc] init];
        p = nil; // 执行到这一行, 由于没有强指针指向对象, 所以对象被释放
    }
    return 0;
}

```

- 默认清空所有指针都是强指针

```objc

int main(int argc, const char * argv[]) {
   @autoreleasepool {
        // p1和p2都是强指针
        Person *p1 = [[Person alloc] init];
        __strong Person *p2 = [[Person alloc] init];
    }
    return 0;
}
```

- 弱指针需要明确说明
    - 注意: 千万不要使用弱指针保存新创建的对象

```objc
int main(int argc, const char * argv[]) {
   @autoreleasepool {
        // p是弱指针, 对象会被立即释放
        __weak Person *p1 = [[Person alloc] init];
    }
    return 0;
}
```

### 5. ARC下多对象内存管理

- ARC和MRC一样, 想拥有某个对象必须用强指针保存对象, 但是不需要在dealloc方法中release

```objc
@interface Person : NSObject
// MRC写法
//@property (nonatomic, retain) Dog *dog;

// ARC写法
@property (nonatomic, strong) Dog *dog;
@end



```



### 6. ARC下@property参数

- strong : 用于OC对象，相当于MRC中的retain
- weak : 用于OC对象，相当于MRC中的assign
- assign : 用于基本数据类型，跟MRC中的assign一样


### 6. ARC下循环引用问题

- ARC和MRC一样，如果A拥有B，B也拥有A，那么必须一方使用弱指针

```objc
@interface Person : NSObject
@property (nonatomic, strong) Dog *dog;
@end

@interface Dog : NSObject
// 错误写法, 循环引用会导致内存泄露
//@property (nonatomic, strong) Person *owner;

// 正确写法, 当如果保存对象建议使用weak
@property (nonatomic, weak) Person *owner;
@end
```
