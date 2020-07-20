---
title: OC 知识：Foundation 框架详尽总结之『数组类』
date: 2016-08-06 23:00:37
tags:
    - 技术
    - iOS 开发
categories:
    - 00 - 技术 - iOS 开发
---


> 本文对 Foundation 框架中的数组类（NSArray、MutableNSArray）的使用做一个详细的总结。

<!--more-->

# 1. NSArray

## 1. NSArray介绍

- NSArray是OC中的数组类，开发中建议尽量使用NSArray替代C语言中的数组
- C语言中虽然也有数组，但在开发的过程中存在一些弊端
    - int array[4] = {10, 89, 27, 76};
    - 只能存放一种类型的数据（类型必须一致）
    - 不能很方便地动态添加数组元素、不能很方便地动态删除数组元素（长度固定）
- Foundation数组是有序的对象集合
- 一般情况下，一个数组中的元素都是一种特定类型，但不是必需的

## 2. NSArray的创建方式
- `+ (instancetype)array;`
- `+ (instancetype)arrayWithObject:(id)anObject;`
- `+ (instancetype)arrayWithObjects:(id)firstObj, ...;`
- `+ (instancetype)arrayWithArray:(NSArray *)array;`
- `+ (id)arrayWithContentsOfFile:(NSString *)path;`
- `+ (id)arrayWithContentsOfURL:(NSURL *)url;`

## 3.NSArray 的使用注意事项

- NSArray直接使用NSLog()作为字符串输出时是小括号括起来的形式。
- 只能存放任意OC对象, 并且是有顺序的
- 不能存储非OC对象, 比如int\float\double\char\enum\struct等
- NSArray中不能存储nil，因为NSArray认为nil是数组的结束（nil是数组元素结束的标记）。nil就是0。0也是基本数据类型，不能存放到NSArray中。
- 它是不可变的，一旦初始化完毕后，它里面的内容就永远是固定的，不能删除里面的元素，也不能再往里面添加元素

```objc
NSArray *arr = [NSArray arrayWithObjects:@"abc", nil ,@"edf",@"hij", nil];
NSLog(@"%@", arr);

输出结果：
(
    abc
)
```

## 4. NSArray的常用方法

```objc
// 先定义一个数组，用于举例说明下面各个常用方法如何使用
NSArray *arr = [NSArray arrayWithObjects:@"abc",@"edf",@"hij", nil];
```

- 获取集合元素个数`- (NSUInteger)count;`

```objc
NSLog(@"count = %lu",[arr count]);

输出结果：count = 3
```

- 获得index位置的元素`- (id)objectAtIndex:(NSUInteger)index;`

```objc
NSLog(@"arr[1] = %@",[arr objectAtIndex:1]);

输出结果：arr[1] = edf
```

- 是否包含某一个元素`- (BOOL)containsObject:(id)anObject;`

```objc
if ([arr containsObject:@"klm"]) {
    NSLog(@"arr中包含klm");
} else {
    NSLog(@"arr中不包含klm");
}

输出结果：arr中不包含klm

```

- 返回第一个元素`- (id)firstObject;`

```objc
NSLog(@"first = %@",[arr firstObject]);

输出结果：first = abc
```

- 返回最后一个元素`- (id)lastObject;` 

```objc
NSLog(@"last = %@",[arr lastObject]);

输出结果：last = hij
```

- 查找anObject元素在数组中的位置(如果找不到，返回-1)`- (NSUInteger)indexOfObject:(id)anObject;`

```objc
NSLog(@"index = %lu",[arr indexOfObject:@"hij"]);

输出结果：index = 2
```

- 在range范围内查找anObject元素在数组中的位置`- (NSUInteger)indexOfObject:(id)anObject inRange:(NSRange)range;`

```objc
NSRange range = {1,2};
NSLog(@"index = %lu",[arr indexOfObject:@"edf" inRange:range]);

输出结果：index = 1
```

## 5. NSArray的简写形式

- 自从2012年开始，Xcode的编译器多了很多自动生成代码的功能，使得OC代码更加精简
- 之前数组的创建方式

```objc
[NSArray arrayWithObjects:@"Jack", @"Rose", @"Jim", nil];

```
- 现在数组的创建方式

```objc
@[@"Jack", @"Rose", @"Jim"];
```

- 之前数组元素的访问方式

```objc
[array objectAtIndex:index];
```

- 现在数组元素的访问方式

```objc
array[index];
```

## 6. NSArray 遍历

### 1.NSArray的下标遍历

```objc
NSArray *arr = @[@"abc", @"edf", @"hij"];
for (int i = 0; i < arr.count; ++i) {
    NSLog(@"arr[%i] = %@", i, arr[i]);
}

输出结果：
arr[0] = abc
arr[1] = edf
arr[2] = hij
```



### 2. NSArray的快速遍历

```objc
NSArray *arr = @[@"abc", @"edf", @"hij"];    
// OC数组可以使用OC中的增强for循环来遍历
// 逐个取出arr中的元素，将取出的元素赋值给obj
// 注意：obj的类型可以根据数组中元素的类型来写，不一定要写NSObject
for (NSString *obj in arr) {
    NSLog(@"obj = %@", obj);
}

输出结果：
obj = abc
obj = edf
obj = hij

```

### 3. NSArray 使用block进行遍历

```objc
NSArray *arr = @[@"abc", @"edf", @"hij"];      
// 使用OC数组的迭代器来遍历
// 每取出一个元素就会调用一次block
// 每次调用block都会将当前取出的元素和元素对应的索引传递给我们
// obj就是当前取出的元素, idx就是当前元素对应的索引
[arr enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
    if (idx == 1) {
        *stop = YES;  // stop用于控制什么时候停止遍历
    }
    NSLog(@"obj = %@, idx = %lu", obj, idx);
}];

输出结果：
obj = abc, idx = 0
obj = edf, idx = 1
```

### 4. NSArray给所有元素发消息

- 让集合里面的所有元素都执行aSelector这个方法
    - `- (void)makeObjectsPerformSelector:(SEL)aSelector;`
    - `- (void)makeObjectsPerformSelector:(SEL)aSelector withObject:(id)argument;`

```objc
// 让数组中所有对象执行这个方法
// 注意：如果数组中的对象没有这个方法会报错，需要实现该方法
//    [arr makeObjectsPerformSelector:@selector(say)];
[arr makeObjectsPerformSelector:@selector(eat:) withObject:@"bread"];
```

## 7. NSArray排序

### 1.NSArray排序

- Foundation自带类排序
    - 使用compare方法对数组中的元素进行排序, 那么数组中的元素必须是Foundation框架中的对象, 也就是说不能是自定义对象

```objc
NSArray *arr = @[@10,@9,@1,@19];
NSLog(@"排序前: %@", arr);
NSArray *newArr = [arr sortedArrayUsingSelector:@selector(compare:)];
NSLog(@"排序后: %@", newArr);

输出结果：
排序前: (
    10,
    9,
    1,
    19
)
排序后: (
    1,
    9,
    10,
    19
)
```

- 自定义类排序

定义一个Person类，Person拥有age属性。

```objc
#import <Foundation/Foundation.h>

@interface Person : NSObject
@property (nonatomic, assign) int age;
@end
```

因为不能使用compare:方法对自定义对象进行排序，我们通过执行区块block对自定义类进行排序，下面是按照age的大小对Person进行排序

```objc
Person *p1 = [Person new];
p1.age = 10;
Person *p2 = [Person new];
p2.age = 20;    
Person *p3 = [Person new];
p3.age = 5;
Person *p4 = [Person new];
p4.age = 7;

NSArray *arr = @[p1, p2, p3, p4];
NSLog(@"排序前: %@", arr);
// 按照人的年龄进行排序
// 该方法默认会按照升序排序
NSArray *newArr = [arr sortedArrayWithOptions:NSSortStable usingComparator:^NSComparisonResult(Person *obj1, Person *obj2) {
// 每次调用该block都会取出数组中的两个元素给我们
return obj1.age > obj2.age;    // 升序
//    return obj1.age < obj2.age;    // 降序
}];
NSLog(@"排序后: %@", newArr);

输出结果：
排序前: (
    "age = 10",
    "age = 20",
    "age = 5",
    "age = 7"
)
排序后: (
    "age = 5",
    "age = 7",
    "age = 10",
    "age = 20"
)
```

## 8. NSArray文件读写

### 1. NSArray数据写入到文件中

```objc
NSArray *arr = @[@"abc", @"def", @"hij", @"klm"];

BOOL flag = [arr writeToFile:@"/Users/Walkers/Desktop/test.plist" atomically:YES];
NSLog(@"flag = %i", flag);

输出结果：flag = 1
```

### 2.从文件中读取数据到NSArray中

```objc
NSArray *newArr = [NSArray arrayWithContentsOfFile:@"/Users/Walkers/Desktop/test.plist"];
NSLog(@"newArr = %@", newArr);

输出结果：
newArr = (
    abc,
    def,
    hij,
    klm
)
```

## 9. NSArray与字符串之间的转换

### 1. 把数组元素链接成字符串
- 用separator作拼接符将数组元素拼接成一个字符串`- (NSString *)componentsJoinedByString:(NSString *)separator;`

```objc
NSArray *arr = @[@"abc", @"edf", @"hij", @"klm"];

NSString *res = [arr componentsJoinedByString:@"*"];
NSLog(@"res = %@", res);

输出结果：res = abc*edf*hij*klm
```

### 2. 字符串分割方法

- 将字符串用separator作为分隔符切割成数组元素`- (NSArray *)componentsSeparatedByString:(NSString *)separator;`

```objc
NSString *str = @"abc-edf-hij-klm";

NSArray *arr = [str componentsSeparatedByString:@"-"];
NSLog(@"arr = %@", arr);

输出结果：
arr = (
    abc,
    edf,
    hij,
    klm
)
```

***

# 2. NSMutableArray

## 1. NSMutableArray介绍

- NSMutableArray是NSArray的子类
- NSArray是不可变的，一旦初始化完毕后，它里面的内容就永远是固定的，不能删除里面的元素，也不能再往里面添加元素
- NSMutableArray是可变的，数组元素的个数未指定并且可以根据需要增长，随时可以往里面添加\更改\删除元素

## 2. NSMutableArray基本用法

- 创建空数组

```objc
NSMutableArray *arr = [NSMutableArray array];
```

- 创建数组，并且指定长度为5，此时也是空数组

```objc
NSMutableArray *arr = [[NSMutableArray alloc] initWithCapacity:5];
```

- 创建一个数组,包含两个元素

```objc
NSMutableArray *arr = [NSMutableArray arrayWithObjects:@"1",@"2", nil];
```

- 调用对象方法创建数组

```objc
NSMutableArray *arr = [[NSMutableArray alloc] initWithObjects:@"1",@"2", nil];
```

- 添加一个元素`- (void)addObject:(id)object;`

```objc
NSMutableArray *arr = [NSMutableArray array];

[arr addObject:@"abc"];
NSLog(@"%@",arr);

输出结果：
(
    abc
)
```



- 添加otherArray的全部元素到当前数组中`- (void)addObjectsFromArray:(NSArray *)array;`

```objc
NSMutableArray *arr = [NSMutableArray arrayWithObjects:@"abc", nil];

[arr addObjectsFromArray:@[@"def",@"hij"]];
NSLog(@"%@",arr);

输出结果：
(
    abc,
    def,
    hij
)
```

- 在index位置插入一个元素`- (void)insertObject:(id)anObject atIndex:(NSUInteger)index;`

```objc
NSMutableArray *arr = [NSMutableArray arrayWithObjects:@"abc", @"hij",nil];

[arr insertObject:@"def" atIndex:1];
NSLog(@"%@",arr);

输出结果：
(
    abc,
    def,
    hij
)
```

- 删除最后一个元素`- (void)removeLastObject;`

```objc
NSMutableArray *arr = [NSMutableArray arrayWithObjects:@"abc",@"def",@"hij",nil];

[arr removeLastObject];
NSLog(@"%@",arr);

输出结果：
(
    abc,
    def
)
```

- 删除所有的元素`- (void)removeAllObjects;`

```objc
NSMutableArray *arr = [NSMutableArray arrayWithObjects:@"abc",@"def",@"hij",nil];

[arr removeAllObjects];
NSLog(@"%@",arr);

输出结果：
(
)
```

- 删除index位置的元素`- (void)removeObjectAtIndex:(NSUInteger)index;`

```objc

NSMutableArray *arr = [NSMutableArray arrayWithObjects:@"abc",@"def",@"hij",nil];
[arr removeObjectAtIndex:1];

NSLog(@"%@",arr);

输出结果：
(
    abc,
    hij
)

```

- 删除特定的元素`- (void)removeObject:(id)object;`

```objc
NSMutableArray *arr = [NSMutableArray arrayWithObjects:@"abc",@"def",@"hij",nil];

[arr removeObject:@"abc"];
NSLog(@"%@",arr);

输出结果：
(
    def,
    hij
)
```

- 删除range范围内的所有元素`- (void)removeObjectsInRange:(NSRange)range;`

```objc
NSMutableArray *arr = [NSMutableArray arrayWithObjects:@"abc",@"def",@"hij",nil];
NSRange range = NSMakeRange(1, 2);

[arr removeObjectsInRange:range];
NSLog(@"%@",arr);

输出结果：
(
    abc
)
```

- 用anObject替换index位置对应的元素`- (void)replaceObjectAtIndex:(NSUInteger)index withObject:(id)anObject;`

```objc
NSMutableArray *arr = [NSMutableArray arrayWithObjects:@"abc",@"def",@"hij",nil];

[arr replaceObjectAtIndex:1 withObject:@"xyz"];
NSLog(@"%@",arr);

输出结果：
(
    abc,
    xyz,
    hij
)
```

- 交换idx1和idx2位置的元素`- (void)exchangeObjectAtIndex:(NSUInteger)idx1 withObjectAtIndex:(NSUInteger)idx2;`

```objc
NSMutableArray *arr = [NSMutableArray arrayWithObjects:@"abc",@"def",@"hij",nil];

[arr exchangeObjectAtIndex:0 withObjectAtIndex:2];
NSLog(@"%@",arr);

输出结果：
(
    hij,
    def,
    abc
)
```

## 3. NSMutableArray 错误用法

- 不可以使用@[]创建可变数组

```objc
NSMutableArray *array = @[@"lnj", @"lmj", @"jjj"];

// 报错, 本质还是不可变数组
[array addObject:@“Peter”];
```
