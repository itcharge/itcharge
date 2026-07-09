---
title: iOS 开发：成员变量（属性，实例变量）的相关知识
categories:
  - iOS 开发
tags:
  - 技术
  - iOS
createTime: '2016/07/22 00:00:00'
permalink: /blogs/tech/ios/member-variable/
---

Objective-C 成员变量与属性语法总结，说明实例变量访问规则、`@public`/`@protected`/`@private` 作用域及 getter/setter 规范。

<!-- more -->

# 【OC 语法】iOS 开发：成员变量（属性，实例变量）的相关知识

> 本文用来对 Objective-C 语法中 成员变量（属性，实例变量）相关知识进行总结和讲解。

## 1. 成员变量介绍

### 1.1 成员变量解释

我们把 Objective-C 中写在类声明的大括号中的变量称之为成员变量(也称为属性，实例变量)。

- 举例：

```objc
@interface Iphone : NSObject
{
    // 成员变量声明
    int _cpu;            // cup   0
    int _size;     // 尺寸  0
    int _color;          // 颜色  0

    // 其中 _cpu、_size、_color 就是 Iphone  类的成员变量
}
```



### 1.2 成员变量特点

- 成员变量只能通过对象来访问
- 成员变量不能离开类，离开类之后就不是成员变量
- 成员变量不能再定义的同时进行初始化
- 成员变量存储在当前对象对应的堆的存储空间中，不会被自动释放，只能手动释放
- 成员变量前加下划线"_"是苹果的编程规范，或者说是程序员的习惯。这样写的好处在下边会提到

## 2. setter 和 getter 方法

我们无法从外界(比如其他类和文件中)直接访问定义在类中的成员变量。为了能够从外界操作成员变量，我们需要为调用者提供相应的方法来对成员变量进行访问、赋值等操作。而定义这些方法都需要有一个有意义的名字，所以就有了 getter-setter 方法。

getter-setter 方法格式和写法是固定的，这也是程序员之间的一种规范，只要有人想要访问成员变量或给成员变量赋值，就会立刻想到 getter-setter 方法，这样就降低了程序员之间的沟通成本。

### 2.1 setter 方法

- 作用：用来设置成员变量，给成员变量赋值，可以在方法里面对变量进行判断，过滤掉一些不合理的值
- 命名规范：
 - 必须是对象方法
 - 返回值类型为 void
 - 方法名必须以 set 开头，而且后面跟上成员变量名去掉”_” ，首字母必须大写
 - 必须提供一个参数，参数类型必须与所对应的成员变量的类型一致
 - 形参名称和成员变量去掉下划线相同
- 举例：

```objc
如：如果成员变量为 int _size 那么与之对应 seter 方法声明为
-(void) setSize: (int) size;
```

- setter 方法的实现

```objc
- (void)setSize:(int)size;
{
     //成员变量以下划线开头的好处,就是可以区分局部变量和成员变量    
    _size = size;
}
```

- setter 方法的好处
 - 不让数据暴露在外,保证了数据的安全性
 - 对设置的数据进行判断，过滤不合理的值(比如空值、负数等等)

### 2.2 getter 方法

- 作用：为调用者返回对象内部的成员变量的值，用来访问成员变量
- 命名规范：
 - 必须是对象方法
 - 必须有返回值,返回值的类型和成员变量的类型一致
 - 方法名必须是成员变量去掉下划线
 - 一定是没有参数的
- 举例

```objc
如：如果成员变量为 int _size 那么与之对应 getter 方法为

- (int) size;
```

- getter 方法的实现

```
- (int)size
{
    return _size;
}
```

- getter 方法的优点：

 - 可以让我们在使用 getter 方法获取数据之前,对数据进行加工
 - 比如双十一活动，我们希望对全线商品的价格在原来的价格基础上打五折，那么我们只要去改成品类的价格的 getter 方法就可以了，让他返回的值为价格 * 0.5

### 2.3 getter/setter 方法注意

- 在实际的开发中，setter 和 getter 方法不一定都会提供。如果内部的成员变量，只允许外界读取，但是不允许修改，则通常只提供 getter 方法而不提供 setter 方法
- 成员变量名的命名以下划线开头，setter 和 getter 方法名不需要带下划线
- 成员变量名使用下划线开头有两个好处
 - 与 getter 方法的方法名区分开来
 - 可以和一些其他的局部变量区分开来，下划线开头的变量，通常都是类的成员变量。当我看到以下划线开头变量，那么他一定是成员变量

## 3. 点语法

### 3.1 点语法基本使用

如果给成员变量提供了 getter 和 setter 方法，就可以通过`点语法`来访问成员变量

### 3.2 点语法的本质

- 其实点语法的本质就是调用了 setter 方法和 getter 方法
- 当使用点语法时，编译器会在程序翻译成二进制的时候将`.语法`自动转换为 setter 和 getter 方法
- 如果点语法在`=`号左边，那么编译器会自动转换为 setter 方法
- 如果点语法在`=`号右边，或者没有等号，那么编译器就会自动转换为 getter 方法

[](https://qcdn.itcharge.cn/images/iOS-Member-variable-001.png)

### 3.3 点语法注意

- 点语法的本质是方法的调用，而不是访问成员变量，当使用点语法时，编译器会自动展开成相应的方法调用
- 如果没有 setter 和 getter 方法，则不能使用点语法
- 不要在 setter 与 getter 方法中使用本属性的点语法

```objc
- (void) setAge:(int)age {
    // 下面的代码会引发死循环
    self.age = age;

    //编译器展开后 [self setAge:age]
}

- (int) age {
    // 下面的代码会引发死循环
    return self.age;

    // 编译器展开后 [self   age]
}
```

## 4. 实例变量修饰符

### 4.1 实例变量的作用域

[](https://qcdn.itcharge.cn/images/iOS-Member-variable-002.png)
1. @public 
 - 公开的
 - 在有对象的前下，任何地方都可以直接访问
2. @protected
 - 受保护的
 - 只能在当前类和子类的对象方法中访问
3. @private
 - 私有的
 - 只能在当前类的对象方法中才能直接访问
4. @package
 - 框架级别的
 - 作用域介于私有和公开之间，只要处于同一个框架中相当于@public，在框架外部相当于@private

- 举例：

```objc
@interface Iphone : NSObject
{
    @public
    int _cpu;
    
    @private
    int _size;
    
    @protected
    int _color;
    
     @package
    double _weight;
}
@end
```

### 4.2 变量修饰符的继承和在子类中的访问

| 修饰符 | 类别 | 能否继承 | 在子类中的访问 |
|-------|-------|--------|---------------|
| @private | 私有成员 | 能被继承 | 不能被外部方法访问 |
| @public | 共有成员 | 能被继承 | 不能被外部方法访问 |
| @protected | 保护成员 | 能被继承 | 不能被外部方法访问 |

### 4.3 实例变量作用域使用注意事项

1. 在 @interface @end 之间声明的成员变量如果不做特别的说明,那么其默认是 protected 的
2. 一个类继承了另一个类,那么就拥有了父类的所有成员变量和方法,注意所有的成员变量它都拥有，只是有的它不能直接访问。例如@private 的

## 5. @property 相关

### 5.1 什么是 @property

- @property 是是声明属性的语法
- @property 用在声明文件中告诉编译器声明成员变量的的访问器(getter/setter)方法
- 使用@property 的好处是：免去我们手工书写 getter 和 setter 方法繁琐的代码

### 5.2 @property 基本使用

- 在@inteface 中，@property 用来自动生成 setter 和 getter 的声明

```
比如用@property int size;就可以代替下面的两行声明

- (int)size;   // getter

- (void)setSize:(int)size;  // setter
```

- @property 编写步骤
 1. 在@inteface 和 @end 之间写上 @property
 2. 在@property 后面写上需要生成 getter/setter 方法声明的属性名称，注意因为 getter/setter 方法名称中的属性不需要 `_`，所以@property 后的属性也不需要 `_`。并且@property 和属性名称之间要用空格隔开
 3. 在@property 和属性名字之间告诉需要生成的属性的数据类型, 注意两边都需要加上空格隔开

## 6. @synthesize 相关

### 6.1 什么是 @synthesize

- @synthesize 是实现属性方法的语法
- @synthesize 用在实现文件中告诉编译器实现成员变量的的访问器(getter/setter)方法
- 使用@synthesize 好处是:免去我们手工书写 getterr 和 setter 方法繁琐的代码

## 6.2 @synthesize 基本使用

- 写在@implementation 中，用来自动生成 setter 和 getter 的实现

```objc
用 @synthesize size; 就可以代替
- (int)size{

}

- (void)setSize:(int)size{

}

//注意：@synthesize size; 并没有告诉 setter 和 getter 把 size 赋值给谁，返回谁

而用@synthesize size= _size;就可以代替
- (int)size{
	return _size;
}

- (void)setSize:(int)size{
	_size = size;
}
```

- @synthesize 编写步骤
 1. 在 @implementation 和 @end 之间写上 @synthesize
 2. 在 @synthesize 后面写上和 @property 中一样的属性名称，这样 @synthesize 就会将 @property 生成的什么拷贝到 @implementation 中
 3. 由于 getter/setter 方法实现是要将传入的形参给属性和获取属性的值，所以在 @synthesize 的属性后面写上要将传入的值赋值给谁和要返回哪个属性的值, 并用等号连接



### 6.3 @synthesize 注意点

- @synthesize age = _age;
 - setter 和 getter 实现中会访问成员变量 _age
 - 如果成员变量 _age 不存在，就会自动生成一个@private 的成员变量 _age
- @synthesize age;
 - setter 和 getter 实现中会访问@synthesize 后同名成员变量 age
 - 如果成员变量 age 不存在，就会自动生成一个@private 的成员变量 age
- 多个属性可以通过一行@synthesize 搞定,多个属性之间用逗号连接

```objc
@synthesize age = _age, number = _number, name  = _name;
```

## 7. @property 拓展

### 7.1 @property 增强

- 自 Xcode4.4 以后，apple 对@property 进行了一个增强，以后不用再写@synthesize 了，只用一个@property 就可以同时生成 setter/getter 方法的声明和实现
- 如果没有告诉@property 要将传入的参数赋值给谁，默认@property 会将传入的属性赋值给 _ 开头的成员变量

```objc
用@property int size;就可以替代下面两行声明
- (int)size;   // getter

- (void)setSize:(int)size;  // setter

以及下面两行实现
- (int)size{
	return _size;
}

- (void)setSize:(int)size{
	_size = size;
}
```

- @property 只会生成最简单的 getter 和 setter 方法的声明和实现，并不会对传入的数据进行判断
 - 如果想对传入的数据进行过滤，那么我们就必须重写 getter/setter 方法
 - 如果不想对传入的数据进行过滤，仅仅是提供一个方法给外界操作成员变量，那么就可以使用@property
 - 如果重写了 setter 方法，那么 property 就只会生成 getter 方法
 - 如果重写了 getter 方法，那么 property 就只会生成 setter 方法
 - 如果同时重写了 getter/setter 方法，那么 property 就不会自动帮我们生成 _ 开头的成员变量(报错)
- 如果利用@property 来生成 getter/setter 方法，那么我们可以不写成员变量, 系统会自动给我们生成一个 _ 开头的成员变量
- 但@property 自动帮我们生成的成员变量是一个私有的成员变量, 也就是说是在.m 文件中生成的, 而不是在.h 文件中生成的。我们在其他文件中无法查看该成员变量，但是可在本类中查看

```
@property int size; 
// 帮我们生成了一个 _size 的成员变量，而该成员变量 _size 是私有成员变量
```
### 7.2 @property 修饰符

- 多线程管理
 - atomic 默认什么不写就是 atomic，意思是只有一个线程访问实例变量。效率很低
 - nonatomic 可以使用多个线程访问实例变量。效率很快，绝大多数情况下使用 nonatomic
- 修饰是否生成 getter 方法的
 - readonly 只生成 getter 方法，不生成 setter 方法
 - readwrite 既生成 getter，又生成 setter 方法（默认）

```objc
@property (nonatomic, readonly) int size;
@property (nonatomic, readwrite) int color;
```

- 给所生成的 getter/setter 方法另起一个名称
 - getter=你定义的 getter 方法名称
 - setter=你定义的 setter 方法名称(注意 setter 方法必须要有 :)

 ```objc
    @property (nonatomic, getter=isMarried)  BOOL  married;
    // 说明，通常 BOOL 类型的属性的 getter 方法要以 is 开头
    ```

- 控制 setter 方法的内存管理
 - assign(默认)：不会帮我们生成 setter 方法内存管理的代码，仅仅只会生成普通的 getter/setter 方法，用于直接赋值，不做任何内存管理(默认，用于非 OC 对象类型)。默认什么都不写就是 assign。被 assign 修饰的变量不是一个对象。主要用于代表简单的数据类型，比如 int、float 等。

 ```objc
    @property(nonatomic, assign) int size;
    ```

 - retain：会自动帮我们生成 getter/setter 方法内存管理的代码，在 setter 方法中，对传入的对象进行引用计数加 1 的操作。retain 一般用于 NSObjct 类以及其子类
	
	```objc
		@property (nonatomic, retain) NSNumber *count;
		// 编译器为其生成的 setter/getter 方法
    
		-(NSNumber *)count {    // getter 方法
			return _count;
		}
		-(void)setCount:(NSNumber *)count {    // setter
		   // 1.判断传入的对象和当前对象是否一样
			if (_count != count) {
				// 2.release 以前的对象
				[_count release];
				// 3.retain 传入的对象
				_count = [count retain];
			}
		}
	```

 - copy：对原有对象进行拷贝。常用于 NSString 类

 ```objc
    @property (nonatomic, copy) NSString *string;
    ```

 - strong：开启 ARC 时才使用。强引用指针，相当于 retain。默认情况下为 strong
	
 ```objc
    @property (nonatomic, strong) UIButton *btn;
    ```

 - weak：开启 ARC 时才使用。弱引用指针，相当于 assign

 ```objc
    @property (nonatomic, weak) UIButton *btn;
    ```
