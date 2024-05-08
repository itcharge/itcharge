> 本文是  iOS 开发：彻底理解内存管理系列的 MRC 篇。
> 用来对 Objective-C 语法中，内存管理 MRC 相关知识进行讲解。

<!--more-->

## 1. 什么是内存管理

程序在运行的过程中，往往涉及到创建对象、定义变量、调用函数或方法，而这些行为都会增加程序的内存占用。

而一个移动设备的内存是有限的，每个软件所能占用的内存也是有限的。

当程序所占用的内存较多时，系统就会发出内存警告，这时就得回收一些不需要再使用的内存空间。比如回收一些不需要再使用的对象、变量等。

如果程序占用内存过大，系统可能会强制关闭程序，造成程序崩溃、闪退现象，影响用户体验。

所以，我们需要对 **「内存」** 进行合理的分配内存、清除内存，回收不需要再使用的对象。从而保证程序的稳定性。

在 iOS 中，我们通常将内存分为五大部分：

- **代码区**：用于存放程序的代码，即 CPU 执行的机器指令，并且是只读的。
- **全局区 / 静态区**：它主要存放静态数据、全局数据和常量。分为未初始化全局区（BSS 段）、初始化全局区：（数据段）。程序结束后由系统释放。
	- **数据段**：用于存放可执行文件中已经初始化的全局变量，也就是用来存放静态分配的变量和全局变量。
	- **BSS 段**：用于存放程序中未初始化的全局变量。
- **常量区**：用于存储已经初始化的常量。程序结束后由系统释放。
- **栈区（Stack）**：用于存放程序临时创建的变量、存放函数的参数值、局部变量等。由编译器自动分配释放。
- **堆区（Heap）**：用于存放进程运行中被动态分配的内存段。它大小不固定，可动态扩张和缩减。由程序员分配和释放。

从上边内存的各个部分说明可以看出：**只有堆区存放的数据需要由程序员分配和释放。**

堆区存放的，主要是继承了 NSObject 的对象，需要由程序员进行分配和释放。其他非对象类型（int、char、float、double、struct、enum 等）则存放在栈区，由系统进行分配和释放。

- 示例：

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        int a = 10; // 栈
        int b = 20; // 栈
        // p : 栈
        // Person 对象（计数器 == 1）: 堆
        Person *p = [[Person alloc] init];
    }
    // 经过上面代码后, 栈里面的变量 a、b、p 都会被回收
    // 但是堆里面的 Person 对象还会留在内存中,因为它是计数器依然是 1
    return 0;
}
```

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-001.png)

***

## 2. 内存管理机制

移动端的内存管理机制，主要有三种：

- 自动垃圾收集（GC）
- 手工引用计数和自动释放池（MRC）
- 自动引用计数（ARC）

其中 iOS 运行环境不支持自动垃圾收集机制（GC）。苹果公司使用的是手工引用计数（MRC）和自动引用计数（ARC）机制。

在自动引用计数（ARC）出现机制之前，一直是通过手工引用计数（MRC）机制这种手写大量管理代码的方式来管理内存。后来苹果公司开发了自动引用计数（ARC）技术，把这部分工作交给了编译器来完成，从而大大简化了开发工作。但是 ARC 依然还是需要注意循环引用的问题。

下面来详细讲解一下「手工引用计数（MRC）」和「自动引用计数（ARC）」。

***

## 3. MRC 手动管理内存（Manual Reference Counting）

### 3.1 引用计数器

> 引用计数器：
一个整数，表示为「对象被引用的次数」。系统需要根据对象的引用计数器来判断对象是否需要被回收。

从字面意义上，可以把引用计数器理解为「对象被引用的次数」，也可以理解为: 「有多少人正在用这个对象」。

系统根据引用计数器的机制来判断对象是否需要被回收。在每次 RunLoop 迭代结束后，都会检查对象的引用计数器，如果引用计数器等于 0，则说明该对象没有地方继续使用它了，可以将其释放掉。

关于「引用计数器」，有以下几个特点：
- 每个 OC 对象都有自己的引用计数器。
- 任何一个对象，刚创建的时候，初始的引用计数为 1。
	- 即使用 `alloc`、`new` 或者 `copy` 创建一个对象时，对象的引用计数器默认就是 1。
- 当没有任何人使用这个对象时，系统才会回收这个对象。也就是说：
    - 当对象的引用计数器为 0 时，对象占用的内存就会被系统回收。
    - 如果对象的引用计数器不为 0 时，那么在整个程序运行过程，它占用的内存就不可能被回收（除非整个程序已经退出）。

### 3.2 引用计数器操作

- 为保证对象的存在，每当创建引用到对象需要给对象发送一条 `retain` 消息，可以使引用计数器值 +1 ( `retain` 方法返回对象本身)。
- 当不再需要对象时，通过给对象发送一条 `release` 消息，可以使引用计数器值 -1。
- 给对象发送 `retainCount` 消息，可以获得当前的引用计数器值。
- 当对象的引用计数为 0 时，系统就知道这个对象不再需要使用了，所以可以释放它的内存，通过给对象发送 `dealloc` 消息发起这个过程。
- 需要注意的是：`release` 并不代表销毁 / 回收对象，仅仅是将计数器 -1。

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // 只要创建一个对象默认引用计数器的值就是 1。
        Person *p = [[Person alloc] init];
        NSLog(@"retainCount = %lu", [p retainCount]); // 打印 1

        // 只要给对象发送一个 retain 消息, 对象的引用计数器就会 +1。
        [p retain];

        NSLog(@"retainCount = %lu", [p retainCount]); // 打印 2
        // 通过指针变量 p，给 p 指向的对象发送一条 release 消息。
        // 只要对象接收到 release 消息, 引用计数器就会 -1。
        // 只要对象的引用计数器为 0, 系统就会释放对象。

        [p release];
        // 需要注意的是: release 并不代表销毁 / 回收对象, 仅仅是将计数器 -1。
        NSLog(@"retainCount = %lu", [p retainCount]); // 1

        [p release]; // 0
        NSLog(@"--------");
    }
//    [p setAge:20];    // 此时对象已经被释放
    return 0;
}
```

### 3.3 dealloc 方法

- 当一个对象的引用计数器值为 0 时，这个对象即将被销毁，其占用的内存被系统回收。
- 对象即将被销毁时系统会自动给对象发送一条 `dealloc` 消息（因此，从 `dealloc` 方法有没有被调用，就可以判断出对象是否被销毁）
- `dealloc` 方法的重写（**注意是在 MRC 中**）
    - 一般会重写 `dealloc` 方法，在这里释放相关资源，`dealloc` 就是对象的遗言
    - 一旦重写了 `dealloc` 方法，就必须调用 `[super dealloc]`，并且放在最后面调用。

```objc
- (void)dealloc {
    NSLog(@"Person dealloc");
    // 注意：super dealloc 一定要写到所有代码的最后面
    [super dealloc]; 
}
```

> `dealloc` 使用注意：
> - 不能直接调用 `dealloc` 方法。
> - 一旦对象被回收了, 它占用的内存就不再可用，坚持使用会导致程序崩溃（野指针错误）。

### 3.4 野指针和空指针

- 只要一个对象被释放了，我们就称这个对象为「僵尸对象（不能再使用的对象）」。
- 当一个指针指向一个僵尸对象（不能再使用的对象），我们就称这个指针为「野指针」。
- 只要给一个野指针发送消息就会报错（EXC_BAD_ACCESS 错误）。

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        Person *p = [[Person alloc] init]; // 执行完引用计数为 1。

        [p release]; // 执行完引用计数为 0，实例对象被释放。
        [p release]; // 此时，p 就变成了野指针，再给野指针 p 发送消息就会报错。
        [p release]; // 报错
    }
    return 0;
}
```

- 为了避免给野指针发送消息会报错，一般情况下，当一个对象被释放后我们会将这个对象的指针设置为空指针。
- 空指针：
    - 没有指向存储空间的指针（里面存的是 nil, 也就是 0）。
    - 给空指针发消息是没有任何反应的。

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        Person *p = [[Person alloc] init]; // 执行完引用计数为 1。

        [p release]; // 执行完引用计数为 0，实例对象被释放。
        p = nil; // 此时，p 变为了空指针。
        [p release]; // 再给空指针 p 发送消息就不会报错了。
        [p release];
    }
    return 0;
}
```

### 3.5 内存管理思想

#### 3.5.1 单个对象内存管理思想

##### 思想一：自己创建的对象，自己持有，自己负责释放

- 通过 `alloc`、`new`、`copy` 或 `mutableCopy` 方法创建并持有对象。
- 当自己持有的对象不再被需要时，必须调用 `release` 或 `autorelease` 方法释放对象。

```objc
id obj = [[NSObject alloc] init];	// 自己创建的对象，自己持有
[obj release];
```

同样，`new` 方法也能持有对象：

```objc
id obj = [NSObject new];	// 自己创建的对象，自己持有
[obj release];
```

而由各类实现的 `copyWithZone:` 方法和 `mutableCopyWithZone:` 方法将生成并持有对象的副本。

另外，除了上面四种方法之外，由上面四种方法名称开头的方法名，也将生成并持有对象：

- `allocMyObject`
- `newMyObject`
- `copyMyObject`
- `mutableCopyMyObject`


##### 思想二：非自己创建的对象，自己也能持有

- 除了用上面方法（`alloc` / `new` / `copy` / `mutableCopy` 方法）所取得的的对象，因为非自己生成并持有，所以自己不是该对象的持有者。
- 通过调用 `retain` 方法，即便是非自己创建的对象，自己也能持有对象。
- 同样当自己持有的对象不再被需要时，必须调用 `release` 方法来释放对象。

```objc
id obj = [NSMutableArray array];	// 取得非自己生成的变量，但自己并不持有。
[obj retain];	// 通过 retain 方法持有对象
[obj release];
```


##### 总结：
- 无论是否是自己创建的对象，自己都可以持有，并负责释放。
- 计数器有加就有减。
- 曾经让对象的计数器 +1，就必须在最后让对象计数器 -1。


#### 3.5.2 多个对象内存管理思想

多个对象之间往往是通过 `setter` 方法产生联系的，其内存管理的方法也是在 `setter` 方法、`dealloc` 方法中实现的。所以只有了解了 `setter` 方法是如何实现的，我们才能了解到多个对象之间的内存管理思想。接下来我们将从零开始，一步步实现 `setter` 方法，了解多个对象之间的内存管理思想。

我们用一个线上斗地主游戏例子来类比一下。假如有一款斗地主游戏，游戏大厅有不同的游戏房间，可供玩家选择。我们定义游戏房间为 Room 类对象，定义玩家为 Person 类对象，玩家对象拥有 `_room` 作为成员变量。

一个玩家对象，如果想要玩游戏，就要持有一个房间对象，并保证在使用房间期间，这个房间对象一直存在，并且在游戏房间没人的时候，还需要将这个房间对象释放。

根据上面的描述，我们可以制定以下规则：
- 只要一个玩家想使用房间（进入房间），就需要对这个游戏房间的引用计数器 +1。
- 只要一个玩家不想再使用房间（离开房间），就需要对这个游戏房间的引用计数器 -1。
- 只要还有至少一个玩家在用某个房间，那么这个游戏房间就不会被回收，引用计数至少为 1。

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-002.png)

下面来定义两个类 玩家类：Person 和 房间类：Room。

- 房间类（Room 类）

```objc
#import <Foundation/Foundation.h>

@interface Room : NSObject
@property int no; // 房间号
@end
```

- 玩家类（Person 类）

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

##### 1. 玩家没有使用房间的情况

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // 1. 创建两个对象
        Person *p = [[Person alloc] init];    // 玩家 p
        Room *r = [[Room alloc] init];        // 房间 r
        r.no = 888;    // 房间号赋值

        [r release];    // 释放房间
        [p release];   // 释放玩家
    }
    return 0;
}
```

上述代码执行完第 4~6 行，即：

```objc
// 1.创建两个对象
Person *p = [[Person alloc] init];    // 玩家 p
Room *r = [[Room alloc] init];        // 房间 r
r.no = 888;    // 房间号赋值
```

之后在内存中的表现如下图所示：

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-003.png)

可见，Room 实例对象和 Person 实例对象之间没有相互联系，所以各自释放不会报错。执行完第 8~9 行代码，即：

```objc
[r release];    // 释放房间
[p release];   // 释放玩家
```

后，将房间对象和玩家对象各自释放掉，在内存中的表现如下图所示：

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-004.png)

最后各自实例对象的内存就会被系统回收。

##### 2. 一个玩家使用一个游戏房间的情况

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // 1. 创建两个对象
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

上边代码执行完第 4~6 行的时候和之前在内存中的表现一样，如图所示：

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-005.png)

当执行完第 10 行代码 `p.room = r;` 时，因为调用了 `setter` 方法，将 Room 实例对象赋值给了 Person 的成员变量，不做其他设置的话，在内存中的表现如下图（做法不对）：

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-006.png)

在调用 `setter` 方法的时候，因为 Room 实例对象多了一个 Person 对象引用，所以应将 Room 实例对象的引用计数 +1 才对，即 `setter` 方法应该像下边一样，对 `room` 进行一次 `retain` 操作。

```objc
- (void)setRoom:(Room *)room { // 调用 room = r;
    // 对房间的引用计数器 +1
    [room retain];
    _room = room;
}
```

那么执行完第 10 行代码 `p.room = r;`，在内存中的表现为：

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-007.png)

继续执行第 12 行代码`[r release];`，释放房间，Room 实例对象引用计数 -1，在内存中的表现如下图所示：

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-008.png)

然后执行第 17 行代码 `[p release];`，释放玩家。这时候因为玩家不在房间里了，房间也没有用了，所以在释放玩家的时候，要把房间也释放掉，也就是在 `delloc` 里边对房间再进行一次  `release` 操作。

这样对房间对象来说，每一次 `retain` / `alloc` 操作都对应一次 `release` 操作。

```objc
- (void)dealloc {
    // 人释放了, 那么房间也需要释放
    [_room release];
    NSLog(@"%s", __func__);

    [super dealloc];
}
```

那么在内存中的表现最终如下图所示：

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-009.png)

最后实例对象的内存就会被系统回收

##### 3. 一个玩家使用一个游戏房间 r 后，换到另一个游戏房间 r2 的情况

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // 1. 创建两个对象
        Person *p = [[Person alloc] init];    // 玩家 p
        Room *r = [[Room alloc] init];        // 房间 r
        r.no = 888;    // 房间号赋值

        // 2. 将房间 r 赋值给玩家 p，表示玩家 p 在使用房间 r
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

执行下边几行代码：

```objc
// 1. 创建两个对象
Person *p = [[Person alloc] init];    // 玩家 p
Room *r = [[Room alloc] init];        // 房间 r
r.no = 888;    // 房间号赋值

// 2. 将房间 r 赋值给玩家 p，表示玩家 p 在使用房间 r
p.room = r; // [p setRoom:r]
[r release];    // 释放房间 r
```

之后的内存表现为：

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-010.png)

接着执行换房操作而不进行其他操作的话，即：

```objc
// 3. 换房
Room *r2 = [[Room alloc] init];
r2.no = 444;
p.room = r2;
```

后的内存表现为：

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-011.png)

最后执行完代码：

```objc
[r2 release];    // 释放房间 r2
[p release];    // 释放玩家 p
```

后的内存表现为：

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-012.png)
可以看出房间 r 并没有被释放，这是因为在进行换房的时候，并没有对房间 r 进行释放。所以应在调用 `setter` 方法的时候，对之前的变量进行一次 `release` 操作。具体 `setter` 方法代码如下：

```objc
- (void)setRoom:(Room *)room { // room = r
        // 将以前的房间释放掉 -1
        [_room release];

        // 对房间的引用计数器 +1
        [room retain];

        _room = room;
    }
}
```

这样在执行完 `p.room = r2;` 之后就会将 房间 r 释放掉，最终内存表现为：

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-013.png)

##### 4. 一个玩家使用一个游戏房间，不再使用游戏房间，将游戏房间释放掉之后，再次使用该游戏房间的情况

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // 1. 创建两个对象
        Person *p = [[Person alloc] init];
        Room *r = [[Room alloc] init];
        r.no = 888;

        // 2. 将房间 r 赋值给玩家 p
        p.room = r; // [p setRoom:r]
        [r release];    // 释放房间 r

        // 3. 再次使用房间 r
        p.room = r;
        [r release];    // 释放房间 r
        [p release];    // 释放玩家 p
    }
    return 0;
}
```

执行下面代码：

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

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-014.png)


然后再执行 ` p.room = r; `，因为 `setter` 方法会将之前的 Room 实例对象先释放掉，此时内存表现为：

![](http://qcdn.itcharge.cn/images/iOS-Memory-management-015.png)

此时 `_room`、`r` 已经变成了一个野指针。之后再对野指针 `r` 发出 `retain` 消息，程序就会崩溃。所以我们在进行 `setter` 方法的时候，要先判断一下是否是重复赋值，如果是同一个实例对象，就不需要重复进行 `release` 和 `retain`。换句话说，如果我们使用的还是之前的房间，那换房的时候就不需要对这个房间再进行 `release` 和 `retain`。则 `setter` 方法具体代码如下：

```objc
- (void)setRoom:(Room *)room { // room = r
    // 只有房间不同才需用 release 和 retain
    if (_room != room) {    // 0ffe1 != 0ffe1
        // 将以前的房间释放掉 -1
        [_room release];

        // 对房间的引用计数器+1
        [room retain];

        _room = room;
    }
}
```

因为 `retain` 不仅仅会对引用计数器 +1, 而且还会返回当前对象，所以上述代码可最终简化成：

```objc
- (void)setRoom:(Room *)room { // room = r
    // 只有房间不同才需用 release 和 retain
    if (_room != room) {    // 0ffe1 != 0ffe1
        // 将以前的房间释放掉 -1
        [_room release];

        _room = [room retain];
    }
}
```

以上就是 `setter` 方法的终极形式。通过上面多个例子，我们也理解了多个对象之间的内存管理思想。

### 3.6 `@property` 参数

- 在成员变量前加上 `@property`，系统就会自动帮我们生成基本的 `setter` / `getter` 方法，但是不会生成内存管理相关的代码。

```objc
@property (nonatomic) int val;
```

- 同样如果在 `property` 后边加上 `assign`，系统也不会帮我们生成 `setter` 方法内存管理的代码，仅仅只会生成普通的 `getter` / `setter` 方法，默认什么都不写就是 `assign`。

```objc
@property(nonatomic, assign) int val;
```

- 如果在 `property` 后边加上 `retain`，系统就会自动帮我们生成 `getter` / `setter` 方法内存管理的代码，但是仍需要我们自己重写 `dealloc` 方法。

```objc
@property(nonatomic, retain) Room *room;
```

### 3.7 自动释放池

当我们不再使用一个对象的时候应该将其空间释放，但是有时候我们不知道何时应该将其释放。为了解决这个问题，Objective-C 提供了 `autorelease` 方法。

- `autorelease` 是一种支持引用计数的内存管理方式，只要给对象发送一条 `autorelease` 消息，会将对象放到一个自动释放池中，当自动释放池被销毁时，会对池子里面的「所有对象」做一次 `release` 操作。

> 注意：这里只是发送 `release` 消息，如果当时的引用计数（reference-counted）依然不为 0，则该对象依然不会被释放。

- `autorelease` 方法会返回对象本身，且调用完 `autorelease` 方法后，对象的计数器不变。

```objc
Person *p = [Person new];
p = [p autorelease];
NSLog(@"count = %lu", [p retainCount]); // 计数还为 1
```

#### 3.7.1 使用 autorelease 有什么好处呢？

- 不用再关心对象释放的时间
- 不用再关心什么时候调用release

#### 3.7.2 autorelease 的原理实质上是什么？

`autorelease` 实际上只是把对 `release` 的调用延迟了，对于每一个 `autorelease`，系统只是把该对象放入了当前的 `autorelease pool` 中，当该 `pool` 被释放时，该 `pool` 中的所有对象会被调用 `release` 方法。

#### 3.7.3 autorelease 的创建方法

1. 使用 NSAutoreleasePool 创建

```objc
NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init]; // 创建自动释放池
[pool release]; // [pool drain]; 销毁自动释放池
```

2. 使用 @autoreleasepool 创建

```objc
@autoreleasepool
{ // 开始代表创建自动释放池

} // 结束代表销毁自动释放池
```

#### 3.7.4 autorelease 的使用方法

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
} // 销毁自动释放池（会给池子中所有对象发送一条 release 消息）
```

#### 3.7.5 autorelease 的注意事项

- 并不是放到自动释放池代码中，都会自动加入到自动释放池

```objc
@autoreleasepool {
    // 因为没有调用 autorelease 方法,所以对象没有加入到自动释放池
    Person *p = [[Person alloc] init];
    [p run];
}
```

- 在自动释放池的外部发送 `autorelease` 不会被加入到自动释放池中
    - `autorelease` 是一个方法，只有在自动释放池中调用才有效。



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

#### 3.7.6 自动释放池的嵌套使用

- 自动释放池是以栈的形式存在。
- 由于栈只有一个入口，所以调用 `autorelease` 会将对象放到栈顶的自动释放池。
> 栈顶就是离调用 `autorelease` 方法最近的自动释放池。

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

- 自动释放池中不适宜放占用内存比较大的对象。
    - 尽量避免对大内存使用该方法，对于这种延迟释放机制，还是尽量少用。
    - 不要把大量循环操作放到同一个 `@autoreleasepool` 之间，这样会造成内存峰值的上升。

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

#### 3.7.7 autorelease 错误用法

- 不要连续调用 `autorelease`。

```objc
@autoreleasepool {
 // 错误写法, 过度释放
    Person *p = [[[[Person alloc] init] autorelease] autorelease];
 }
```

- 调用 `autorelease` 后又调用 `release`（错误）。

```objc
@autoreleasepool {
    Person *p = [[[Person alloc] init] autorelease];
    [p release]; // 错误写法, 过度释放
}
```

### 3.8 MRC 中避免循环 retain

定义两个类 Person 类和 Dog 类

- Person 类：

```objc
#import <Foundation/Foundation.h>
@class Dog;

@interface Person : NSObject
@property(nonatomic, retain)Dog *dog;
@end
```

- Dog 类：

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

就会出现 A 对象要拥有 B 对象，而 B 对应又要拥有 A 对象，此时会形成循环 retain，导致 A 对象和 B 对象永远无法释放。

那么如何解决这个问题呢？

- 不要让 A retain B，B retain A。
- 让其中一方不要做 retain 操作即可。
- 当两端互相引用时，应该一端用 retain，一端用 assign。