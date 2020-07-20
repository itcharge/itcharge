---
title: iOS 开发：『Blocks』详尽总结 （二）底层原理
date: 2019-03-28 14:20:58
tags:
    - 技术
    - iOS 开发
categories:
    - 00 - 技术 - iOS 开发
---

> 本文用来介绍 iOS 开发中 『Blocks』的底层原理。我将通过 Blocks 由 OC 转变的 C++源码来一步步解析 Blocks 的底层原理。
> 
> 通过本文您将了解到：
> 1. Blocks 的实质是什么？
> 2. Block 截获局部变量和特殊区域变量
> 3. Block 的存储区域
> 4. Block 的循环引用
> 
> 文中 Demo 我已放在了 Github 上，Demo 链接：[传送门](https://github.com/bujige/YSC-Blocks-Demo)

<!--more-->

![](http://qncdn.bujige.net/images/iOS-Blocks-02-001.png)

# 1. Blocks 的实质是什么？

在 iOS 开发：『Blocks』详尽总结 （一）基本使用 中我们讲解了 Blocks 的基本使用，也知道了 Blocks 是 **带有局部变量的匿名函数**。但是 Block  的实质究竟是什么呢？类型？变量？还是什么黑科技？

要想了解 Block 的本质，就需要从 Block 对应的 C++ 源码来入手。

下面我们通过一步步的源码剖析来了解 Block 的本质。

## 1.1 Blocks 由 OC 转 C++ 源码方法

1. 在项目中添加 blocks.m 文件，并写好 block 的相关代码。
2. 打开『终端』，执行 `cd XXX/XXX` 命令，其中 `XXX/XXX` 为 block.m 所在的目录。
3. 继续执行`clang -rewrite-objc block.m`
4. 执行完命令之后，block.m 所在目录下就会生成一个 block.cpp 文件，这就是我们需要的 block 相关的 C++ 源码。

## 1.2 Blocks 源码概览

下面我们删除掉 block.m 其他无关的代码，只保留 blocks 相关的代码，可以得到如下结果。

- 转换前 OC 代码：

```objc
int main () {
    void (^myBlock)(void) = ^{
        printf("myBlock\n");
    };

    myBlock();

    return 0;
}
```

- 转换后 C++ 源码：

```C++
/* 包含 Block 实际函数指针的结构体 */
struct __block_impl {
    void *isa;
    int Flags;               
    int Reserved;        // 今后版本升级所需的区域大小
    void *FuncPtr;      // 函数指针
};

/* Block 结构体 */
struct __main_block_impl_0 {
    // impl：Block 的实际函数指针，指向包含 Block 主体部分的 __main_block_func_0 结构体
    struct __block_impl impl;
    // Desc：Desc 指针，指向包含 Block 附加信息的 __main_block_desc_0（） 结构体
    struct __main_block_desc_0* Desc;
    // __main_block_impl_0：Block 构造函数
    __main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, int flags=0) {
        impl.isa = &_NSConcreteStackBlock;
        impl.Flags = flags;
        impl.FuncPtr = fp;
        Desc = desc;
    }
};

/* Block 主体部分结构体 */
static void __main_block_func_0(struct __main_block_impl_0 *__cself) {
    printf("myBlock\n");
}

/* Block 附加信息结构体：包含今后版本升级所需区域大小，Block 的大小*/
static struct __main_block_desc_0 {
    size_t reserved;        // 今后版本升级所需区域大小
    size_t Block_size;    // Block 大小
} __main_block_desc_0_DATA = { 0, sizeof(struct __main_block_impl_0)};

/* main 函数 */
int main () {
    void (*myBlock)(void) = ((void (*)())&__main_block_impl_0((void *)__main_block_func_0, &__main_block_desc_0_DATA));
    ((void (*)(__block_impl *))((__block_impl *)myBlock)->FuncPtr)((__block_impl *)myBlock);

    return 0;
}
```

下面我们一步步来拆解转换后的源码。

## 1.3 Block 结构体

我们先来看看 `__main_block_impl_0` 结构体（ Block 结构体）

```C++
/* Block 结构体 */
struct __main_block_impl_0 {
    // impl：Block 的实际函数指针，指向包含 Block 主体部分的 __main_block_func_0 结构体
    struct __block_impl impl;
    // Desc：Desc 指针，指向包含 Block 附加信息的 __main_block_desc_0（） 结构体
    struct __main_block_desc_0* Desc;
    // __main_block_impl_0：Block 构造函数
    __main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, int flags=0) {
        impl.isa = &_NSConcreteStackBlock;
        impl.Flags = flags;
        impl.FuncPtr = fp;
        Desc = desc;
    }
};
```

从上边我们可以看出，`__main_block_impl_0` 结构体（Block 结构体）包含了三个部分：

1. 成员变量 `impl`;
2. 成员变量 `Desc` 指针;
3. `__main_block_impl_0` 构造函数。

我们先来把这几个部分剖析一下。

### 1.3.1 `struct __block_impl impl` 说明

第一部分 `impl` 是 `__block_impl` 结构体类型的成员变量。`__block_impl` 包含了 Block 实际函数指针 `FuncPtr`，`FuncPtr` 指针指向 Block 的主体部分，也就是 Block 对应 OC 代码中的 `^{ printf("myBlock\n"); };` 部分。还包含了标志位 `Flags`，今后版本升级所需的区域大小  `Reserved`，`__block_impl` 结构体的实例指针 `isa`。

```c++
/* 包含 Block 实际函数指针的结构体 */
struct __block_impl {
    void *isa;               // 用于保存 Block 结构体的实例指针
    int Flags;               // 标志位
    int Reserved;        // 今后版本升级所需的区域大小
    void *FuncPtr;      // 函数指针
};
```

### 1.3.2 `struct __main_block_desc_0* Desc` 说明

第二部分 Desc 是指向的是 `__main_block_desc_0` 类型的结构体的指针型成员变量，`__main_block_desc_0` 结构体用来描述该 Block 的相关附加信息：

1. 今后版本升级所需区域大小： `reserved` 变量。
2. Block 大小：`Block_size` 变量。

```c++
/* Block 附加信息结构体：包含今后版本升级所需区域大小，Block 的大小*/
static struct __main_block_desc_0 {
    size_t reserved;      // 今后版本升级所需区域大小
    size_t Block_size;  // Block 大小
} __main_block_desc_0_DATA = { 0, sizeof(struct __main_block_impl_0)};
```

### 1.3.3 `__main_block_impl_0` 构造函数说明

第三部分是 `__main_block_impl_0` 结构体（Block 结构体） 的构造函数，负责初始化 `__main_block_impl_0` 结构体（Block 结构体） 的成员变量。

```c++
__main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, int flags=0) {
    impl.isa = &_NSConcreteStackBlock;
    impl.Flags = flags;
    impl.FuncPtr = fp;
    Desc = desc;
}
```

关于结构体构造函数中对各个成员变量的赋值，我们需要先来看看 `main()` 函数中，对该构造函数的调用。

```c++
  void (*myBlock)(void) = ((void (*)())&__main_block_impl_0((void *)__main_block_func_0, &__main_block_desc_0_DATA));
```

我们可以把上面的代码稍微转换一下，去掉不同类型之间的转换，使之简洁一点：

```c++
struct __main_block_impl_0 temp = __main_block_impl_0(__main_block_func_0, &__main_block_desc_0_DATA);
struct __main_block_impl_0 myBlock = &temp;
```

这样，就容易看懂了。该代码将通过 `__main_block_impl_0` 构造函数，生成的 `__main_block_impl_0` 结构体（Block 结构体）类型实例的指针，赋值给 `__main_block_impl_0` 结构体（Block 结构体）类型的指针变量 `myBlock`。

可以看到， 调用 `__main_block_impl_0` 构造函数的时候，传入了两个参数。

1. 第一个参数：`__main_block_func_0`。
    - 其实就是 Block 对应的主体部分，可以看到下面关于 `__main_block_func_0` 结构体的定义 ，和 OC 代码中 `^{ printf("myBlock\n"); };` 部分具有相同的表达式。
    - 这里参数中的 `__cself` 是指向 Block 的值的指针变量，相当于 OC 中的 `self`。   

    ```c++
    /* Block 主体部分结构体 */
    static void __main_block_func_0(struct __main_block_impl_0 *__cself) {
        printf("myBlock\n");
    }
    ```
2. 第二个参数：`__main_block_desc_0_DATA`：`__main_block_desc_0_DATA` 包含该 Block 的相关信息。
我们再来结合之前的 `__main_block_impl_0` 结构体定义。
    - `__main_block_impl_0` 结构体（Block 结构体）可以表述为：

    ```c++
    struct __main_block_impl_0 {
        void *isa;               // 用于保存 Block 结构体的实例指针
        int Flags;               // 标志位
        int Reserved;        // 今后版本升级所需的区域大小
        void *FuncPtr;      // 函数指针
        struct __main_block_desc_0* Desc;      // Desc：Desc 指针
    };
    ```

    - `__main_block_impl_0` 构造函数可以表述为：

    ```c++
    impl.isa = &_NSConcreteStackBlock;    // isa 保存 Block 结构体实例
    impl.Flags = 0;        // 标志位赋值
    impl.FuncPtr = __main_block_func_0;    // FuncPtr 保存 Block 结构体的主体部分
    Desc = &__main_block_desc_0_DATA;    // Desc 保存 Block 结构体的附加信息
    ```

## 1.4 Block 实质总结

至此，Block 的实质就要真相大白了。

`__main_block_impl_0` 结构体（Block 结构体）相当于 Objective-C 类对象的结构体，`isa` 指针保存的是所属类的结构体的实例的指针。`_NSConcreteStackBlock` 相当于 Block 的结构体实例。对象 `impl.isa = &_NSConcreteStackBlock;` 语句中，将 Block 结构体的指针赋值给其成员变量 `isa`，相当于 Block 结构体的成员变量 保存了 Block 结构体的指针，这里和 Objective-C 中的对象处理方式是一致的。

> 也就是说明： **Block 的实质就是对象。** 
> Block 跟其他所有的 NSObject 一样，都是对象。果不其然，万物皆对象，古人诚不欺我。

---

# 2. Block 截获局部变量和特殊区域变量

## 2.1 Blcok 截获局部变量的实质

回顾一下上篇文章讲解的例子：

```
// 使用 Blocks 截获局部变量值
- (void)useBlockInterceptLocalVariables {
    int a = 10, b = 20;

    void (^myLocalBlock)(void) = ^{
        printf("a = %d, b = %d\n",a, b);
    };

    myLocalBlock();    // 输出结果：a = 10, b = 20

    a = 20;
    b = 30;

    myLocalBlock();    // 输出结果：a = 10, b = 20
}
```

从中可以看到，我们在第一次调用 `myLocalBlock();` 之后已经重新给变量 `a`、变量 `b` 赋值了，但是第二次调用 `myLocalBlock();` 的时候，使用的还是之前对应变量的值。

> 这是因为 Block 语法的表达式使用的是它之前声明的局部变量 `a`、变量 `b`。Blocks 中，Block 表达式截获所使用的局部变量的值，保存了该变量的瞬时值。所以在第二次执行 Block 表达式时，即使已经改变了局部变量 `a` 和 `b` 的值，也不会影响 Block 表达式在执行时所保存的局部变量的瞬时值。 
> 这就是 Blocks 变量截获局部变量值的特性。

可是，**为什么 Blocks 变量使用的是局部变量的瞬时值，而不是局部变量的当前值呢？**

我们来看一下对应的 C++ 代码：

```c++
struct __main_block_impl_0 {
    struct __block_impl impl;
    struct __main_block_desc_0* Desc;
    int a;
    int b;
    __main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, int _a, int _b, int flags=0) : a(_a), b(_b) {
        impl.isa = &_NSConcreteStackBlock;
        impl.Flags = flags;
        impl.FuncPtr = fp;
        Desc = desc;
    }
};

static void __main_block_func_0(struct __main_block_impl_0 *__cself) {
    int a = __cself->a; // bound by copy
    int b = __cself->b; // bound by copy

    printf("a = %d, b = %d\n",a, b);
}

static struct __main_block_desc_0 {
    size_t reserved;
    size_t Block_size;
} __main_block_desc_0_DATA = { 0, sizeof(struct __main_block_impl_0)};

int main () {
    int a = 10, b = 20;

    void (*myLocalBlock)(void) = ((void (*)())&__main_block_impl_0((void *)__main_block_func_0, &__main_block_desc_0_DATA, a, b));
    ((void (*)(__block_impl *))((__block_impl *)myLocalBlock)->FuncPtr)((__block_impl *)myLocalBlock);

    a = 20;
    b = 30;

    ((void (*)(__block_impl *))((__block_impl *)myLocalBlock)->FuncPtr)((__block_impl *)myLocalBlock);
}
```

1. 可以看到 `__main_block_impl_0` 结构体（Block 结构体）中多了两个成员变量 `a` 和 `b`，这两个变量就是 Block 截获的局部变量。 `a` 和 `b` 的值来自与 `__main_block_impl_0` 构造函数中传入的值。
    ```
    struct __main_block_impl_0 {
        struct __block_impl impl;
        struct __main_block_desc_0* Desc;
        int a;    // 增加的成员变量 a
        int b;    // 增加的成员变量 b
        __main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, int _a, int _b, int flags=0) : a(_a), b(_b) {    
            impl.isa = &_NSConcreteStackBlock;
            impl.Flags = flags;
            impl.FuncPtr = fp;
            Desc = desc;
        }
    };
```
```

2. `还可以看出 __main_block_func_0`（保存 Block 主体部分的结构体）中，变量 `a`、`b` 的值使用的 `__cself` 获取的值。
而 `__cself->a`、`__cself->b` 是通过值传递的方式传入进来的，而不是通过指针传递。这也就说明了 `a`、`b` 只是 Block 内部的变量，改变 Block 外部的局部变量值，并不能改变 Block 内部的变量值。
```
    static void __main_block_func_0(struct __main_block_impl_0 *__cself) {
        int a = __cself->a; // bound by copy
        int b = __cself->b; // bound by copy
        printf("a = %d, b = %d\n",a, b);
    }
    ```

> 那么来总结一下：
>
> 在定义 Block 表达式的时候，局部变量使用**『值传递』**的方式传入 Block 结构体中，并保存为 Block 的成员变量。
> 
> 而当外部局部变量发生变化的时候，Block 结构体内部对应的的成员变量的值并没有发生改变，所以无论调用几次，Block 表达式结果都没有发生改变。

如果在 Block 主体部分对外部局部变量进行修改呢？类似下面这样，是不是就可以将截获的外部局部变量修改了？

```objc
int a = 10, b = 20;

void (^myLocalBlock)(void) = ^{
    a = 20;
    b = 30;

    printf("a = %d, b = %d\n",a, b);
};

myLocalBlock();   
```

很遗憾，编译直接报错了。

![](http://qncdn.bujige.net/images/iOS-Blocks-02-002.png)


这种方式也走不通。

> 由此我们暂时可以得出一个结论：
>
> **被截获的自动变量的值是无法直接修改的。**

可是，凭啥不能改变？如果我们非要改变呢，该咋整？

有一个办法，可以通过 `__block` 说明符修饰局部变量。

## 2.2 使用 `__block` 说明符更改局部变量值

```objc
// 使用 __block 说明符修饰，更改局部变量值
- (void)useBlockQualifierChangeLocalVariables {
    __block int a = 10, b = 20;

    void (^myLocalBlock)(void) = ^{
        a = 20;
        b = 30;

        printf("a = %d, b = %d\n",a, b);    // 输出结果：a = 20, b = 30
    };

    myLocalBlock();
}
```

从中我们可以发现：通过 `__block` 修饰的局部变量，可以在 Block 的主体部分中改变值。

我们来转换下源码，分析一下：

```c++
struct __Block_byref_a_0 {
    void *__isa;
    __Block_byref_a_0 *__forwarding;
    int __flags;
    int __size;
    int a;
};

struct __Block_byref_b_1 {
    void *__isa;
    __Block_byref_b_1 *__forwarding;
    int __flags;
    int __size;
    int b;
};

struct __main_block_impl_0 {
    struct __block_impl impl;
    struct __main_block_desc_0* Desc;
    __Block_byref_a_0 *a; // by ref
    __Block_byref_b_1 *b; // by ref
    __main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, __Block_byref_a_0 *_a, __Block_byref_b_1 *_b, int flags=0) : a(_a->__forwarding), b(_b->__forwarding) {
        impl.isa = &_NSConcreteStackBlock;
        impl.Flags = flags;
        impl.FuncPtr = fp;
        Desc = desc;
    }
};

static void __main_block_func_0(struct __main_block_impl_0 *__cself) {
    __Block_byref_a_0 *a = __cself->a; // bound by ref
    __Block_byref_b_1 *b = __cself->b; // bound by ref

    (a->__forwarding->a) = 20;
    (b->__forwarding->b) = 30;

    printf("a = %d, b = %d\n",(a->__forwarding->a), (b->__forwarding->b));
}

static void __main_block_copy_0(struct __main_block_impl_0*dst, struct __main_block_impl_0*src) {_Block_object_assign((void*)&dst->a, (void*)src->a, 8/*BLOCK_FIELD_IS_BYREF*/);_Block_object_assign((void*)&dst->b, (void*)src->b, 8/*BLOCK_FIELD_IS_BYREF*/);}

static void __main_block_dispose_0(struct __main_block_impl_0*src) {_Block_object_dispose((void*)src->a, 8/*BLOCK_FIELD_IS_BYREF*/);_Block_object_dispose((void*)src->b, 8/*BLOCK_FIELD_IS_BYREF*/);}

static struct __main_block_desc_0 {
    size_t reserved;
    size_t Block_size;
    void (*copy)(struct __main_block_impl_0*, struct __main_block_impl_0*);
    void (*dispose)(struct __main_block_impl_0*);
} __main_block_desc_0_DATA = { 0, sizeof(struct __main_block_impl_0), __main_block_copy_0, __main_block_dispose_0};

int main() {
    __attribute__((__blocks__(byref))) __Block_byref_a_0 a = {(void*)0,(__Block_byref_a_0 *)&a, 0, sizeof(__Block_byref_a_0), 10};
    __Block_byref_b_1 b = {(void*)0,(__Block_byref_b_1 *)&b, 0, sizeof(__Block_byref_b_1), 20};

    void (*myLocalBlock)(void) = ((void (*)())&__main_block_impl_0((void *)__main_block_func_0, &__main_block_desc_0_DATA, (__Block_byref_a_0 *)&a, (__Block_byref_b_1 *)&b, 570425344));
    ((void (*)(__block_impl *))((__block_impl *)myLocalBlock)->FuncPtr)((__block_impl *)myLocalBlock);

    return 0;
}
```

可以看到，只是加上了一个 `__block`，代码量就增加了很多。

我们从 `__main_block_impl_0` 开始说起：

```c++
struct __main_block_impl_0 {
    struct __block_impl impl;
    struct __main_block_desc_0* Desc;
    __Block_byref_a_0 *a; // by ref
    __Block_byref_b_1 *b; // by ref
    __main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, __Block_byref_a_0 *_a, __Block_byref_b_1 *_b, int flags=0) : a(_a->__forwarding), b(_b->__forwarding) {
        impl.isa = &_NSConcreteStackBlock;
        impl.Flags = flags;
        impl.FuncPtr = fp;
        Desc = desc;
    }
};
```

我们在 `__main_block_impl_0` 结构体中可以看到： 原 OC 代码中，被 `__block` 修饰的局部变量 `__block int a`、`__block int b` 分别变成了 `__Block_byref_a_0`、`__Block_byref_b_1` 类型的结构体指针 `a`、结构体指针 `b`。这里使用结构体指针 `a` 、结构体指针 `b` 说明 `_Block_byref_a_0`、`__Block_byref_b_1` 类型的结构体并不在 `__main_block_impl_0` 结构体中，而只是通过指针的形式引用，这是为了可以在多个不同的 Block 中使用 `__block` 修饰的变量。

`__Block_byref_a_0`、`__Block_byref_b_1` 类型的结构体声明如下：  

```c++

struct __Block_byref_a_0 {
    void *__isa;
    __Block_byref_a_0 *__forwarding;
    int __flags;
    int __size;
    int a;
};

struct __Block_byref_b_1 {
    void *__isa;
    __Block_byref_b_1 *__forwarding;
    int __flags;
    int __size;
    int b;
};
```

拿第一个 `__Block_byref_a_0` 结构体定义来说明，`__Block_byref_a_0` 有 5 个部分：
1. `__isa`：标识对象类的 `isa` 实例变量
2. `__forwarding`：传入变量的地址
3. `__flags`：标志位
4. `__size`：结构体大小
5. `a`：存放实变量 `a` 实际的值，相当于原局部变量的成员变量（和之前不加__block修饰符的时候一致）。

再来看一下 `main()` 函数中，`__block int a`、`__block int b` 的赋值情况。

顺便把代码整理一下，使之简易一点：

```c++
__Block_byref_a_0 a = {
    (void*)0,
    (__Block_byref_a_0 *)&a, 
    0, 
    sizeof(__Block_byref_a_0), 
    10
};

__Block_byref_b_1 b = {
    0,
    &b, 
    0, 
    sizeof(__Block_byref_b_1), 
    20
};
```

还是拿第一个` __Block_byref_a_0 a` 的赋值来说明。

可以看到 `__isa` 指针值传空，`__forwarding` 指向了局部变量 `a` 本身的地址，`__flags` 分配了 0，`__size` 为结构体的大小，`a` 赋值为 10。下图用来说明 `__forwarding` 指针的指向情况。

![](http://qncdn.bujige.net/images/iOS-Blocks-02-003.png)


这下，我们知道 `__forwarding` 其实就是局部变量 `a` 本身的地址，那么我们就可以通过 `__forwarding` 指针来访问局部变量，同时也能对其进行修改了。

来看一下 Block 主体部分对应的 `__main_block_func_0` 结构体来验证一下。

```c++
static void __main_block_func_0(struct __main_block_impl_0 *__cself) {
    __Block_byref_a_0 *a = __cself->a; // bound by ref
    __Block_byref_b_1 *b = __cself->b; // bound by ref

    (a->__forwarding->a) = 20;
    (b->__forwarding->b) = 30;

    printf("a = %d, b = %d\n",(a->__forwarding->a), (b->__forwarding->b));
}
```

可以看到 `(a->__forwarding->a) = 20;` 和 `(b->__forwarding->b) = 30;` 是通过指针取值的方式来改变了局部变量的值。这也就解释了通过 `__block` 来修饰的变量，在 Block 的主体部分中改变值的原理其实是：通过**『指针传递』**的方式。

## 2.3 更改特殊区域变量值  

除了通过 `__block` 说明符修饰的这种方式修改局部变量的值之外，还有一些特殊区域的变量，我们也可以在 Block 的内部将其修改。

这些特殊区域的变量包括：**静态局部变量**、**静态全局变量**、**全局变量**。

我们还是通过 OC 代码和 C++ 源码来说明一下：

- OC 代码：

```objc
int global_val = 10; // 全局变量
static int static_global_val = 20; // 静态全局变量

int main() {
    static int static_val = 30; // 静态局部变量

    void (^myLocalBlock)(void) = ^{
        global_val *= 1;
        static_global_val *= 2;
        static_val *= 3;

        printf("static_val = %d, static_global_val = %d, global_val = %d\n",static_val, static_global_val, static_val);
    };

    myLocalBlock();

    return 0;
}

```

- C++ 代码：

```c++
int global_val = 10;
static int static_global_val = 20;

struct __main_block_impl_0 {
    struct __block_impl impl;
    struct __main_block_desc_0* Desc;
    int *static_val;
    __main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, int *_static_val, int flags=0) : static_val(_static_val) {
        impl.isa = &_NSConcreteStackBlock;
        impl.Flags = flags;
        impl.FuncPtr = fp;
        Desc = desc;
    }
};

static void __main_block_func_0(struct __main_block_impl_0 *__cself) {
    int *static_val = __cself->static_val; // bound by copy
    global_val *= 1;
    static_global_val *= 2;
    (*static_val) *= 3;

    printf("static_val = %d, static_global_val = %d, global_val = %d\n",(*static_val), static_global_val, (*static_val));
}

static struct __main_block_desc_0 {
    size_t reserved;
    size_t Block_size;
} __main_block_desc_0_DATA = { 0, sizeof(struct __main_block_impl_0)};

int main() {
    static int static_val = 30;

    void (*myLocalBlock)(void) = ((void (*)())&__main_block_impl_0((void *)__main_block_func_0, &__main_block_desc_0_DATA, &static_val));
    ((void (*)(__block_impl *))((__block_impl *)myLocalBlock)->FuncPtr)((__block_impl *)myLocalBlock);

    return 0;

}

```

从中可以看到：

在 `__main_block_impl_0` 结构体中，将静态局部变量 `static_val` 以指针的形式添加为成员变量，而静态全局变量 `static_global_val`、全局变量 `global_val` 并没有添加为成员变量。

```c++
int global_val = 10;
static int static_global_val = 20;

struct __main_block_impl_0 {
    struct __block_impl impl;
    struct __main_block_desc_0* Desc;
    int *static_val;
    __main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, int *_static_val, int flags=0) : static_val(_static_val) {
        impl.isa = &_NSConcreteStackBlock;
        impl.Flags = flags;
        impl.FuncPtr = fp;
        Desc = desc;
    }
};
```

再来看一下 Block 主体部分对应的 `__main_block_func_0` 结构体部分。静态全局变量 `static_global_val`、全局变量 `global_val` 是直接访问的，而静态局部变量 `static_val` 则是通过『指针传递』的方式进行访问和赋值。

```c++
static void __main_block_func_0(struct __main_block_impl_0 *__cself) {
    int *static_val = __cself->static_val; // bound by copy
    global_val *= 1;
    static_global_val *= 2;
    (*static_val) *= 3;

    printf("static_val = %d, static_global_val = %d, global_val = %d\n",(*static_val), static_global_val, (*static_val));
}
```

---

# 3. Block 的存储区域

通过之前对 Block 本质的探索，我们知道了 Block 的本质是 Objective-C 对象。通过上述代码中 `impl.isa = &_NSConcreteStackBlock;`，可以知道该 Block 的类名为 `NSConcreteStackBlock`，根据名称可以看出，该 Block 是存于栈区中的。而与之相关的，还有 `_NSConcreteGlobalBlock`、`_NSConcreteMallocBlock`。

## 3.1 _NSConcreteGlobalBlock

在以下两种情况下使用 Block 的时候，Block 为 `NSConcreteGlobalBlock` 类对象。
1. 记述全局变量的地方，使用 Block 语法时；
2. Block 语法的表达式中没有截获的自动变量时。

`NSConcreteGlobalBlock` 类的 Block 存储在**『程序的数据区域』**。因为存放在程序的数据区域，所以即使在变量的作用域外，也可以通过指针安全的使用。

- 记述全局变量的地方，使用 Block 语法示例代码：

```oc
void (^myGlobalBlock)(void) = ^{
    printf("GlobalBlock\n");
};

int main() {
    myGlobalBlock();

    return 0;
}
```

通过对应 C++ 源码，我们可以发现：Block 结构体的成员变量 `isa` 赋值为：`impl.isa = &_NSConcreteGlobalBlock;`，说明该 Block 为 `NSConcreteGlobalBlock` 类对象。

## 3.2 _NSConcreteStackBlock

除了 **3.1 _NSConcreteGlobalBlock** 中提到的两种情形，其他情形下创建的 Block 都是 `NSConcreteStackBlock` 对象，平常接触的 Block 大多属于 `NSConcreteStackBlock` 对象。

`NSConcreteStackBlock` 类的 Block 存储在『栈区』的。如果其所属的变量作用域结束，则该 Block 就会被废弃。如果 Block 使用了 `__block` 变量，则当 `__block` 变量的作用域结束，则 `__block` 变量同样被废弃。

![](http://qncdn.bujige.net/images/iOS-Blocks-02-004.png)


## 3.3 _NSConcreteMallocBlock

为了解决栈区上的 Block 在变量作用域结束被废弃这一问题，Block 提供了 **『复制』** 功能。可以将 Block 对象和 `__block` 变量从栈区复制到堆区上。当 Block 从栈区复制到堆区后，即使栈区上的变量作用域结束时，堆区上的 Block 和 `__block` 变量仍然可以继续存在，也可以继续使用。

![](http://qncdn.bujige.net/images/iOS-Blocks-02-005.png)


此时，『堆区』上的 Block 为 `NSConcreteMallocBlock` 对象，Block 结构体的成员变量 isa 赋值为：`impl.isa = &_NSConcreteMallocBlock;`

那么，什么时候才会将 Block 从栈区复制到堆区呢？

这就涉及到了 Block 的自动拷贝和手动拷贝。

## 3.4 Block 的自动拷贝和手动拷贝

### 3.4.1 Block 的自动拷贝

在使用 ARC 时，大多数情形下编译器会自动进行判断，自动生成将 Block 从栈上复制到堆上的代码：

1. 将 Block 作为函数返回值返回时，会自动拷贝；
2. 向方法或函数的参数中传递 Block 时，使用以下两种方法的情况下，会进行自动拷贝，否则就需要手动拷贝：
    1. Cocoa 框架的方法且方法名中含有 `usingBlock` 等时；  
    2. `Grand Central Dispatch（GCD）` 的 API。

### 3.4.2 Block 的手动拷贝

我们可以通过『copy 实例方法（即 `alloc / new / copy / mutableCopy`）』来对 Block 进行手动拷贝。当我们不确定 Block 是否会被遗弃，需不需要拷贝的时候，直接使用 copy 实例方法即可，不会引起任何的问题。

关于 Block 不同类的拷贝效果总结如下：

| Block 类  | 存储区域 | 拷贝效果 |
| :---: | :---: | :---: |
| _NSConcreteStackBlock | 栈区 | 从栈拷贝到堆 |
| _NSConcreteGlobalBlock | 程序的数据区域 | 不做改变 |
| _NSConcreteMallocBlock | 堆区 | 引用计数增加 |

## 3.5 __block 变量的拷贝

在使用 `__block` 变量的 Block 从栈复制到堆上时，`__block` 变量也会受到如下影响：

| __block 变量的配置存储区域 | Block 从栈复制到堆时的影响 |
| :---: | :---: |
| 堆区 | 从栈复制到堆，并被 Block 所持有 |
| 栈区 | 被 Block 所持有 |

当然，如果不再有 Block 引用该 `__block` 变量，那么 `__block` 变量也会被废除。

---

# 4. Block 的循环引用

从上文 **2. Block 截获局部变量和特殊区域变量** 中我们知道 Block 会对引用的局部变量进行持有。同样，如果 Block 也会对引用的对象进行持有（引用计数 + 1），从而会导致相互持有，引起循环引用。

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

我们将 retainCycleBlcok.m 转换为 C++ 代码来看一下：

节选部分 C++ 代码：

```C++
struct __main_block_impl_0 {
    struct __block_impl impl;
    struct __main_block_desc_0* Desc;
    Person *person;
    __main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, Person *_person, int flags=0) : person(_person) {
        impl.isa = &_NSConcreteStackBlock;
        impl.Flags = flags;
        impl.FuncPtr = fp;
        Desc = desc;
    }
};

static void __main_block_func_0(struct __main_block_impl_0 *__cself) {
    Person *person = __cself->person; // bound by copy

    NSLog((NSString *)&__NSConstantStringImpl__var_folders_ct_0dyw1pvj6k16t5z8t0j0_ghw0000gn_T_retainCycleBlcok_8957e0_mi_0,person);
}
```

可以看到 `__main_block_impl_0` 结构体中增加了成员变量 `person`，同时 `__main_block_func_0` 结构体中也使用了 `__cself->person`。

这样就导致了：`person` 持有成员变量 `myBlock blk`，而 `blk` 也同时持有成员变量 `person`，就造成了循环引用问题。

那么，如何来解决这个问题呢？

## 4.1 ARC 下，通过 __weak 修饰符来消除循环引用

在 ARC 下，可声明附有 `__weak` 修饰符的变量，并将对象赋值使用。

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

这样就可以解决循环引用的问题。我们再来转换为 C++ 代码来看看。

> 这里需要改下转换 C++ 指令，因为使用原指令会报错：error: cannot create __weak reference because the current deployment target does not support weak references
> 
> 这里需要使用 `clang -rewrite-objc -fobjc-arc -stdlib=libc++ -mmacosx-version-min=10.7 -fobjc-runtime=macosx-10.7 -Wno-deprecated-declarations retainCycleBlcok.m` 命令来转换。
> 
> 参考链接：[How to use __weak reference in clang?](https://stackoverflow.com/questions/40946716/how-to-use-weak-reference-in-clang/40946887)

使用 `__weak` 修饰后的 Block 示例代码中，节选的部分 C++ 代码：

```C++
struct __main_block_impl_0 {
    struct __block_impl impl;
    struct __main_block_desc_0* Desc;
    Person *__weak weakPerson;
    __main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, Person *__weak _weakPerson, int flags=0) : weakPerson(_weakPerson) {
        impl.isa = &_NSConcreteStackBlock;
        impl.Flags = flags;
        impl.FuncPtr = fp;
        Desc = desc;
    }
};

static void __main_block_func_0(struct __main_block_impl_0 *__cself) {
    Person *__weak weakPerson = __cself->weakPerson; // bound by copy

    NSLog((NSString *)&__NSConstantStringImpl__var_folders_ct_0dyw1pvj6k16t5z8t0j0_ghw0000gn_T_retainCycleBlcok_447367_mi_0,weakPerson);
}
```

可以看到，`__main_block_impl_0` 使用过了 `__weak` 对成员变量 `person` 进行弱引用。

这样，`person` 持有成员变量 `myBlock blk`，而 `blk` 对 `person` 进行弱引用，从而就消除了循环引用。

## 4.2 MRC 下，通过 __block 修饰符来消除循环引用

MRC 下，是不支持 `__weak` 修饰符的。我们可以通过 `__block` 来消除循环引用。

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

> 使用 `clang -rewrite-objc -fno-objc-arc -stdlib=libc++ -mmacosx-version-min=10.7 -fobjc-runtime=macosx-10.7 -Wno-deprecated-declarations retainCycleBlcok.m` 命令来转换为 C++ 代码。

使用 `__block` 修饰后的 Block 示例代码中，节选的部分 C++ 代码：

```c++
struct __main_block_impl_0 {
    struct __block_impl impl;
    struct __main_block_desc_0* Desc;
    __Block_byref_blockPerson_0 *blockPerson; // by ref
    __main_block_impl_0(void *fp, struct __main_block_desc_0 *desc, __Block_byref_blockPerson_0 *_blockPerson, int flags=0) : blockPerson(_blockPerson->__forwarding) {
        impl.isa = &_NSConcreteStackBlock;
        impl.Flags = flags;
        impl.FuncPtr = fp;
        Desc = desc;
    }
};

static void __main_block_func_0(struct __main_block_impl_0 *__cself) {
    __Block_byref_blockPerson_0 *blockPerson = __cself->blockPerson; // bound by ref

    NSLog((NSString *)&__NSConstantStringImpl__var_folders_ct_0dyw1pvj6k16t5z8t0j0_ghw0000gn_T_retainCycleBlcok_536cd4_mi_0,(blockPerson->__forwarding->blockPerson));
}
```

可以看到，通过 `__block` 引用的 `blockPerson`，生成了 `__Block_byref_blockPerson_0` 结构体指针。这里通过指针的方式来访问 `person`，而没有对 `person` 进行强引用，所以不会造成循环引用。

---

# 参考资料
- 书籍：『Objective-C 高级编程 iOS 与OS X 多线程和内存管理』
- 博文：[《Objective-C 高级编程》干货三部曲（二）：Blocks篇](https://juejin.im/post/58f40c0a8d6d810064879aaf)

---


至此，Blocks 相关内容已经全部总结完毕，前前后后大概花费了差不多三周的时间。原本只是想简单写一下 Blocks 的基本应用，写着写着就去翻了下 『Objective-C 高级编程 iOS 与OS X 多线程和内存管理 』中关于 Block 的篇章。也借鉴了大佬关于这本书中对于 Blocks 的理解。然后就有了这篇关于 Blocks 的底层原理部分。
希望大家能够喜欢。
