---
title: iOS 开发：『Blocks』详尽总结 （一）基本使用
date: 2019-03-27 15:51:48
tags:
    - 技术
    - iOS 开发
categories:
    - 00 - 技术 - iOS 开发
---

> 本文用来介绍 iOS开发中 『Blocks』的基本使用。通过本文您将了解到：
> 1. 什么是 **Blocks**
> 2. Blocks 变量语法
> 3. Blocks 变量的声明与赋值
> 4. Blocks 变量截获局部变量值特性
> 5. 使用 __block 说明符
> 6. Blocks 变量的循环引用以及如何避免
> 
> 文中 Demo 我已放在了 Github 上，Demo 链接：[传送门](https://github.com/bujige/YSC-Blocks-Demo)

<!--more-->

![](http://qncdn.bujige.net/images/iOS-Blocks-01-001.png)

# 1. 什么是 **Blocks** ？

一句话总结：**Blocks** 是带有 **局部变量** 的 **匿名函数**（不带名称的函数）。

Blocks 也被称作 **闭包**、**代码块**。展开来讲，Blocks 就是一个代码块，把你想要执行的代码封装在这个代码块里，等到需要的时候再去调用。

下边我们先来理解 **局部变量**、**匿名函数** 的含义。

## 1.1 局部变量

在 C 语言中，定义在函数内部的变量称为 **局部变量**。它的作用域仅限于函数内部， 离开该函数后就是无效的，再使用就会报错。

```C
int x, y; // x，y 为全局变量

int fun(int a) {
    int b, c; //a，b，c 为局部变量
    return a+b+c;
}

int main() {
    int m, n; // m，n 为局部变量
    return 0;
}
```

从上边的代码中，我们可以看出：

1. 我们在开始位置定义了变量 x 和 变量 y。 x 和 y 都是全局变量。它们的作用域默认是整个程序，也就是所有的源文件，包括 .c 和 .h 文件。
2. 而我们在 fun() 函数中定义了变量 a、变量 b、变量 c。它们的作用域是 fun() 函数。只能在 fun() 函数内部使用，离开 fun() 函数就是无效的。
3. 同理，main() 函数中的变量 m、变量 n 也只能在 main() 函数内部使用。

## 1.2 匿名函数

匿名函数指的是不带有名称的函数。但是 C 语言中不允许存在这样的函数。

在 C 语言中，一个普通的函数长这样子：

```C
int fun(int a);
```

fun 就是这个函数的名称，在调用的时候必须要使用该函数的名称 fun 来调用。

```C
int result = fun(10);
```

在 C 语言中，我们还可以通过函数指针来直接调用函数。但是在给函数指针赋值的时候，同样也是需要知道函数的名称。

```C
int (*funPtr)(int) = &fun;
int result = (*funPtr)(10);
```

而我们通过 Blocks，可以直接使用函数，不用给函数命名。

---

# 2. Blocks 变量语法

> 我们使用 `^` 运算符来声明 Blocks 变量，并将 Blocks 对象主体部分包含在 `{}` 中，同时，句尾加 `;` 表示结尾。

下边来看一个官方的示例：

```objc
int multiplier = 7;
int (^ myBlock)(int)= ^(int num) {
    return num * multiplier;
};
```

这个 Blocks 示例中，**myBlock** 是声明的块对象，返回类型是 **整型值**，myBlock 块对象有一个 **参数**，参数类型为整型值，参数名称为 num。myBlock 块对象的 **主体部分** 为 `return num * multiplier;`，包含在 `{}` 中。

![](http://qncdn.bujige.net/images/iOS-Blocks-01-002.png)


参考上面的示例，我们可以将 Blocks 表达式语法表述为：

> ^ 返回值类型 (参数列表) { 表达式 };

例如，我们可以写出这样的 Block 语法：

```objc
^ int (int count) { return count + 1; };
```

Blocks 规定可以省略好多项目。例如：**返回值类型**、**参数列表**。如果用不到，都可以省略。

## 2.1 省略返回值类型：` ^ (参数列表) { 表达式 };`

上边的 Blocks 语法就可以写为：

```objc
^ (int count) { return count + 1; };
```

表达式中，return 语句使用的是 `count + 1` 语句的返回类型。如果表达式中有多个 return 语句，则所有 return 语句的返回值类型必须一致。

如果表达式中没有 return 语句，则可以用 void 表示，或者也省略不写。代码如下：。

```objc
^ void (int count)  { printf("%d\n", count); };    // 返回值类型使用 void
^ (int count) { printf("%d\n", count); };    // 省略返回值类型
```

## 2.2 省略参数列表 `^ 返回值类型 (void) { 表达式 };`

如果表达式中，没有使用参数，则用 void 表示，也可以省略 void。

```objc
^ int (void) { return 1; };    // 参数列表使用 void
^ int { return 1; };    // 省略参数列表类型
```

## 2.3 省略返回值类型、参数列表：` ^ { 表达式 };`

从上边 2.1 中可以看出，无论有无返回值，都可以省略返回值类型。并且，从 2.2 中可以看出，如果不需要参数列表的话，也可以省略参数列表。则代码可以简化为：

```objc
^ { printf("Blocks"); }; 
```

---

# 3. Blocks 变量的声明与赋值

## 3.1 Blocks 变量的声明与赋值语法

Blocks 变量的声明与赋值语法可以总结为：  

> 返回值类型 (^变量名) (参数列表) = Blocks 表达式

注意：此处返回值类型不可以省略，若无返回值，则使用 void 作为返回值类型。

例如，定义一个变量名为 blk 的 Blocks 变量：

```Objc
int (^blk) (int)  = ^(int count) { return count + 1; };
int (^blk1) (int);    // 声明变量名为 blk1 的 Blocks 变量
blk1 = blk;        // 将 blk 赋值给 blk1
```

Blocks 变量的声明语法有点复杂，其实我们可以和 C 语言函数指针的声明类比着来记。

> Blocks 变量的声明就是把声明函数指针类型的变量 `*` 变为 `^`。

```objc
//  C 语言函数指针声明与赋值
int func (int count) {
    return count + 1;
}
int (*funcptr)(int) = &func;

// Blocks 变量声明与赋值
int (^blk) (int)  = ^(int count) { return count + 1; };
```

## 3.2 Blocks 变量的声明与赋值的使用  

### 3.2.1 作为局部变量：`返回值类型 (^变量名) (参数列表) =  返回值类型 (参数列表) { 表达式 };`

我们可以把 Blocks 变量作为局部变量，在一定范围内（函数、方法内部）使用。

```objc
// Blocks 变量作为本地变量
- (void)useBlockAsLocalVariable {
    void (^myLocalBlock)(void) = ^{
        NSLog(@"useBlockAsLocalVariable");
    };

    myLocalBlock();
}

```

### 3.2.2 作为带有 property 声明的成员变量：`@property (nonatomic, copy) 返回值类型 (^变量名) (参数列表);`

作用类似于 delegate，实现 Blocks 回调。

```objc
/* Blocks 变量作为带有 property 声明的成员变量 */
@property (nonatomic, copy) void (^myPropertyBlock) (void);

// Blocks 变量作为带有 property 声明的成员变量
- (void)useBlockAsProperty {
    self.myPropertyBlock = ^{
        NSLog(@"useBlockAsProperty");
    };

    self.myPropertyBlock();
}
```

### 3.2.3 作为 OC 方法参数：`- (void)someMethodThatTaksesABlock:(返回值类型 (^)(参数列表)) 变量名;`

可以把 Blocks 变量作为 OC 方法中的一个参数来使用，通常 blocks 变量写在方法名的最后。

```objc
// Blocks 变量作为 OC 方法参数
- (void)someMethodThatTakesABlock:(void (^)(NSString *)) block {
    block(@"someMethodThatTakesABlock:");
}
```

### 3.2.4 调用含有 Block 参数的 OC方法：`[someObject someMethodThatTakesABlock:^返回值类型 (参数列表) { 表达式}];`

```objc
// 调用含有 Block 参数的 OC方法
- (void)useBlockAsMethodParameter {
    [self someMethodThatTakesABlock:^(NSString *str) {
        NSLog(@"%@",str);
    }];
}
```

通过 3.2.3 和 3.2.4 中，Blocks 变量作为 OC 方法参数的调用，我们同样可以实现类似于 delegate 的作用，即 Blocks 回调（后边应用场景中会讲）。

### 3.2.5 作为 typedef 声明类型：

```
typedef 返回值类型 (^声明名称)(参数列表);
声明名称 变量名 = ^返回值类型(参数列表) { 表达式 };
```

```objc
// Blocks 变量作为 typedef 声明类型
- (void)useBlockAsATypedef {
    typedef void (^TypeName)(void);
    
    // 之后就可以使用 TypeName 来定义无返回类型、无参数列表的 block 了。
    TypeName myTypedefBlock = ^{
        NSLog(@"useBlockAsATypedef");
    };

    myTypedefBlock();
}
```

---

# 4. Blocks 变量截获局部变量值特性

先来看一个例子。

```objc
// 使用 Blocks 截获局部变量值
- (void)useBlockInterceptLocalVariables {
    int a = 10, b = 20;

    void (^myLocalBlock)(void) = ^{
        printf("a = %d, b = %d\n",a, b);
    };

    myLocalBlock();    // 打印结果：a = 10, b = 20

    a = 20;
    b = 30;

    myLocalBlock();    // 打印结果：a = 10, b = 20
}
```

为什么两次打印结果都是 `a = 10, b = 20`？

明明在第一次调用 `myLocalBlock();` 之后已经重新给变量 a、变量 b 赋值了，为什么第二次调用 `myLocalBlock();` 的时候，使用的还是之前对应变量的值？

因为 Block 语法的表达式使用的是它之前声明的局部变量 a、变量 b。Blocks 中，Block 表达式截获所使用的局部变量的值，保存了该变量的瞬时值。所以在第二次执行 Block 表达式时，即使已经改变了局部变量 a 和 b 的值，也不会影响 Block 表达式在执行时所保存的局部变量的瞬时值。

 这就是 Blocks 变量截获局部变量值的特性。

---

# 5. 使用 __block 说明符

实际上，在使用 Block 表达式的时候，只能使用保存的局部变量的瞬时值，并不能直接对其进行改写。直接修改编译器会直接报错，如下图所示。

![](http://qncdn.bujige.net/images/iOS-Blocks-01-003.png)


那么如果，我们想要该写 Block 表达式中截获的局部变量的值，该怎么办呢？

如果，我们想在 Block 表达式中，改写 Block 表达式之外声明的局部变量，需要在该局部变量前加上 `__block` 的修饰符。

这样我们就能实现：在 Block 表达式中，为表达式外的局部变量赋值。

```objc
// 使用 __block 说明符修饰，更改局部变量值
- (void)useBlockQualifierChangeLocalVariables {
    __block int a = 10, b = 20;
    void (^myLocalBlock)(void) = ^{
        a = 20;
        b = 30;
        
        printf("a = %d, b = %d\n",a, b);  // 打印结果：a = 20, b = 30
    };
    
    myLocalBlock();
}
```

可以看到，使用 __block 说明符修饰之后，我们在 Block表达式中，成功的修改了局部变量值。

---

# 6. Blocks 变量的循环引用以及如何避免

从上文中我们知道 Block 会对引用的局部变量进行持有。同样，如果 Block 也会对引用的对象进行持有，从而会导致相互持有，引起循环引用。

```objc
/* —————— retainCycleBlcok.m —————— */   
#import <Foundation/Foundation.h>
#import "Person.h"
int main() {
    Person *person = [[Person alloc] init];
    person.blk = ^{
        NSLog(@"%@",person);
    };

    return 0;
}


/* —————— Person.h —————— */ 
#import <Foundation/Foundation.h>

typedef void(^myBlock)(void);

@interface Person : NSObject
@property (nonatomic, copy) myBlock blk;
@end


/* —————— Person.m —————— */ 
#import "Person.h"

@implementation Person    

@end
```

上面 `retainCycleBlcok.m` 中 `main()` 函数的代码会导致一个问题：person 持有成员变量 myBlock blk，而 blk 也同时持有成员变量 person，两者互相引用，永远无法释放。就造成了循环引用问题。

那么，如何来解决这个问题呢？

## 6.1 ARC 下，通过 __weak 修饰符来消除循环引用

在 ARC 下，可声明附有 __weak 修饰符的变量，并将对象赋值使用。

```
int main() {
    Person *person = [[Person alloc] init];
    __weak typeof(person) weakPerson = person;

    person.blk = ^{
        NSLog(@"%@",weakPerson);
    };

    return 0;
}
```

这样，通过 __weak，person 持有成员变量 myBlock blk，而 blk 对 person 进行弱引用，从而就消除了循环引用。

## 6.2 MRC 下，通过 __block 修饰符来消除循环引用

MRC 下，是不支持 __weak 修饰符的。但是我们可以通过 __block 来消除循环引用。

```c++
int main() {
    Person *person = [[Person alloc] init];
    __block typeof(person) blockPerson = person;

    person.blk = ^{
        NSLog(@"%@", blockPerson);
    };

    return 0;
}
```

通过 __block 引用的 blockPerson，是通过指针的方式来访问 person，而没有对 person 进行强引用，所以不会造成循环引用。

---

# 参考资料
- 书籍：『Objective-C 高级编程 iOS 与OS X 多线程和内存管理』
- 博文：[How Do I Declare A Block in Objective-C?](http://fuckingblocksyntax.com/)

---

以上是 **iOS 开发：『Blocks』详尽总结 （一）基本使用** 的全部内容，可以用来了解 Block，入门使用。下一篇我们通过 Block 由 OC 代码转变的 C++ 源码来抽丝剥茧的讲一下 Block 的底层原理。
