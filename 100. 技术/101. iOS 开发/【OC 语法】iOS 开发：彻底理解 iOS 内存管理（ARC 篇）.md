> 本文是 iOS 开发：彻底理解内存管理系列的 MRC 篇。
> 用来对 Objective-C 语法中，内存管理 MRC 相关知识进行讲解。


<!--more-->


> Automatic Reference Counting，自动引用计数，即 ARC，WWDC 2011 和 iOS 5 所引入的最大的变革和最激动人心的变化。ARC 是新的 LLVM 3.0 编译器的一项特性，使用 ARC，可以说一 举解决了广大 iOS 开发者所憎恨的手动内存管理的麻烦。

- 使用 ARC 后，系统会检测出何时需要保持对象，何时需要自动释放对象，何时需要释放对象，编译器会管理好对象的内存，会在何时的地方插入 `retain`、`release` 和 `autorelease`，通过生成正确的代码去自动释放或者保持对象。我们完全不用担心编译器会出错。

## 1. ARC 所有权修饰符

「引用计数式内存管理」的本质部分在 ARC 中并没有改变，ARC 只是自动帮我们处理了「引用计数」的相关部分。

为了处理对象，ARC 引入了以下四种变量所有权修饰符。

- `__strong`：强指针，默认所有对象的指针变量都是强指针类型。只要还有一个强指针指向某个对象，则这个对象就会一直存活。
- `__weak`：弱指针，不能持有对象实例。如果一个对象没有强指针引用，则弱指针引用会被置为 nil。
- `__unsafe_unretained`：和 `__weak` 相似，是一种弱引用关系。区别在于如果一个对象没有强指针引用，则 `__unsafe_unretained` 引用不会被置为 nil，而是会变成一个野指针。
`__autoreleasing`：用于通过引用传递对象，指示以引用（`id*`）传入的参数并在函数返回时自动释放。

### 1.1 `__strong` 修饰符

默认所有对象的所有权修饰符都是强指针类型。也就是说：

```objc
id obj = [NSObject alloc] init];
```

等同于：

```objc
id __strong obj = [NSObject alloc] init];
```

其对应的内存管理过程如下：

```objc
{
	id __strong obj = [NSObject alloc] init];	//obj 自己生成并持有对象
}	// obj 超过作用域，强引用失效，将会自动释放所持有的对象
```

### 1.2 `__weak` 修饰符

`__weak` 修饰符大多用来解决引用计数式内存管理中的「循环引用」问题的。如果两个以上的成员变量互相强引用对方，则两个对象将永远不会被释放，从而发生内存泄漏。所谓内存泄露就是当废弃的对象在超出其生存周期后继续存在。

举个例子，比如下边的 Test 类，生成两个实例对象 test0、test1，通过 `setOject:` 方法，造成了相互引用：

```objc
@interface Test : NSObject
{
	id __strong obj_;
}

- (void)setObject: (id __strong)obj;
@end

@implementation Test
- (id)init {
    self = [super init];
    return self;
}

- (void)setObject: (id __strong)obj {
    obj_ = obj;
}
@end
```

```objc
id test0 = [[Test alloc] init];	// test0 生成并持有对象 A
id test1 = [[Test alloc] init];	// test1 生成并持有对象 B
[test0 setObject: test1];		// test0 强引用对象 B
[test1 setObject: test0];		// test1 强引用对象 A
```

因为`alloc` 方法和 `setObject` 方法都是强引用，所以会出现两个对象互相强引用对方的情况。

可以使用 `__weak` 修饰符消除循环引用。因为带 `__weak` 修饰符的变量不持有对象，所以在超出其变量作用域时，对象就会被释放。

```objc
@interface Test:NSObject
{
    id __weak obj_;
}

- (void)setObject:(id __strong)obj;
@end
```

### 1.3 `__unsafe_unretained` 修饰符

就像上边提到的那样，`__unsafe_unretained` 和 `__weak` 相似，是一种弱引用关系。区别在于如果一个对象没有强指针引用，则 `__unsafe_unretained` 引用不会被置为 nil，而是会变成一个野指针。

那有了 `__weak`，为什么还有 `__unsafe_unretained` 呢？

`__unsafe_unretained ` 主要是跟 C 语言代码相互。此外，`__weak` 会消耗一定的性能，使用 `__weak` 需要检查对象是否被释放，在追踪是否被释放的时候需要追踪一些信息，则使用 `__unsafe_unretained` 比 `__weak` 快，消耗 CPU 资源也比 `__weak` 少。

而且一个对象有大量的 `__weak` 引用对象的时候，当对象被释放，那么此时就要遍历 `weak` 表，把表里所有的指针置空，消耗  CPU 资源。

综上所述，当明确知道对象的生命期时，选择 `__unsafe_unretained` 会有一些性能提升。但是 `__unsafe_unretained` 也容易引发野指针问题。

### 1.4 `__autoreleasing` 修饰符

在 ARC 模式下，我们不能显示的使用 `autorelease` 方法了，但是 `autorelease` 的机制还是有效的，我们可以通过将对象赋给 `__autoreleasing` 修饰的变量，就能达到在 MRC 模式下调用对象的 `autorelease` 方法同样的效果。

附有 `__autoreleasing` 修饰的变量不是局部变量，它的生命周期由`autoreleasepool` 负责，在 ` @autoreleasepool` 结束之前都能确保该对象存在。

```objc
@autoreleasepool{
    id __autoreleasing obj = [[NSObject alloc] init];
}
```

上述代码主要将 NSObject 类对象注册到 `autoreleasepool` 线程池中，其模拟器源码如下：

```objc
id pool = objc_autoreleasePoolPush();
id obj = objc_msgSend(NSObject, @selector(alloc));
objc_msgSend(obj, @selector(init));
objc_autorelease(obj);
objc_autoreleasePoolPop(pool);
```

可以看出：`__autoreleasing` 修饰的对象会被注册到 Autorelease Pool 中，并在 Autorelease Pool 销毁时被释放，和 MRC 特性下的 `autorelease` 的意义相同。

## 2. ARC 的使用

在 MRC 的时代，我们需要自己调用 `retain` 方法去持有一个对象，而现在不需要的。我们唯一需要做的是使用一个指针指向这个对象，只要这个指针没有被置空，对象就会一直保持在堆上。当我们将指针指向新的对象时，原来的对象就会被 `release` 一次。具体用法如下：

```objc
int main(int argc, const char * argv[]) {
    // 不用写 release, main 函数执行完毕后 p 会被自动释放
    Person *p = [[Person alloc] init];

    return 0;
}
```

`p` 指针现在指向 Person 对象，此时这个对象（Person 类生成的对象）将会被 p 指针强引用，此时 `p` 就持有了这个对象。
直到 main 函数执行完毕，Person 类生成的对象超出了作用范围的空间，此时 `p` 也不再持有该对象，该对象也即将被销毁，内存得到释放。

##  3. ARC 的使用规则

- 不能使用 `retain` / `release` / `retainCount` / `autorelease`，使用会导致编译器报错。
- 不能使用 `NSAllocateObject` / `NSDeallocateObject `，使用会导致编译器报错。
- 对象的生成／持有的方法必须遵循以下命名规则：`alloc` / `new` / `copy` / `mutableCopy` / `init`。
- 不能显式调用 `dealloc`。重写父类的 `dealloc` 方法时，不能再调用 `[super dealloc];`。
- 使用 `@autorelease` 块代替 NSAutoreleasePool。

##  4. ARC 下单对象内存管理

- 局部变量释放后对象随之被释放：

```objc
int main(int argc, const char * argv[]) {
   @autoreleasepool {
        Person *p = [[Person alloc] init];
    } // 执行到这一行局部变量 p 释放
    // 由于没有强指针指向对象, 所以对象也释放
    return 0;
}

```

- 清空指针后对象随之被释放：

```objc
int main(int argc, const char * argv[]) {
   @autoreleasepool {
        Person *p = [[Person alloc] init];
        p = nil; // 执行到这一行, 由于没有强指针指向对象, 所以对象被释放
    }
    return 0;
}

```

- 默认情况下所有指针都是强指针

```objc
int main(int argc, const char * argv[]) {
   @autoreleasepool {
        // p1 和 p2 都是强指针
        Person *p1 = [[Person alloc] init];
        __strong Person *p2 = [[Person alloc] init];
    }
    return 0;
}
```

- 弱指针使用注意：千万不要使用弱指针保存新创建的对象。

```objc
int main(int argc, const char * argv[]) {
   @autoreleasepool {
        // p1 是弱指针，对象会被立即释放
        __weak Person *p1 = [[Person alloc] init];
    }
    return 0;
}
```

## 5. ARC 下多对象内存管理

- ARC 和 MRC 一样, 想拥有某个对象必须用强指针保存对象, 但是不需要在 `dealloc` 方法中调用 `release`。

```objc
@interface Person : NSObject
// MRC 写法
//@property (nonatomic, retain) Dog *dog;

// ARC 写法
@property (nonatomic, strong) Dog *dog;
@end
```

## 6. ARC 下 @property 参数

- strong：表示指向并拥有该对象。用于 OC 对象，相当于 MRC 中的 retain。
- weak：表示指向但不拥有该对象。用于 OC 对象，相当于 MRC 中的 assign
- assign：用于修饰基本数据类型，跟 MRC 中的 assign 一样，不涉及内存管理。
- copy：与 `strong` 类似，不同之处在于 copy 在对象进行赋值（调用 `setter` 方法）时执行的是 `copy` 操作而不是 `retain` 操作。

这里说一下 `strong` 和 `copy` 的区别。

`@property` 参数会帮我们生成对应的 `setter`、`getter` 方法。不同的修饰符生成的 `setter`、`getter` 方法也不同。

`strong` 对应的 `setter` 方法，是将参数进行了 `retain` 操作，而 `copy` 对应的 `setter` 方法，是将参数内容进行了 `copy` 操作。

`copy` 操作在原对象是可变类型和不可变类型两种不同情况下是有区别的：

- 当赋值参数为不可变类型（比如 NSString）时，在进行赋值操作时，`copy` 操作跟 `strong` 效果一样，只是对参数做了一次浅拷贝，地址不变。
- 当赋值参数为可变类型（比如 NSMutableString）时，在进行赋值操作时，`strong` 的指针还是指向原地址。而 `copy` 操作则是对参数内容做了一次深拷贝，生成了一个新的对象，地址发生了改变。

这样，如果赋值参数为可变类型，当赋值参数发生改变的时候，使用 `strong` 修饰的对象也会跟着改变，因为两者指向的是同一个地址。而使用 `copy` 修饰的对象则不会跟着改变，这是因为 `copy` 指针指向的是一个新的对象。

所以 `copy` 多用于修饰带有可变类型的不可变对象上（NSString / NSArray / NSDictionary）。这是为了避免可变类型数据赋值给不可变类型数据时，内容发生改变的情况。

## 7. ARC 下循环引用问题

- ARC 和 MRC 一样，如果 A 拥有 B，B 也拥有 A，那么必须一方使用弱指针。

```objc
@interface Person : NSObject
@property (nonatomic, strong) Dog *dog;
@end

@interface Dog : NSObject
// 错误写法, 循环引用会导致内存泄露
//@property (nonatomic, strong) Person *owner;

// 正确写法, 当如果保存对象建议使用 weak
@property (nonatomic, weak) Person *owner;
@end
```

## 参考资料

- [【书籍】Objective-C 高级编程 iOS 与 OS X 多线程和内存管理](https://book.douban.com/subject/24720270/)
- [【博文】《Objective-C 高级编程》干货三部曲（一）：引用计数篇](https://juejin.cn/post/6844903473272586254)
- [【博文】Objective-C 属性修饰符 strong 和 copy 的区别](https://segmentfault.com/a/1190000002520583)
- [【博文】iOS strong 和 copy 的区别](https://juejin.cn/post/6844903654160334856)