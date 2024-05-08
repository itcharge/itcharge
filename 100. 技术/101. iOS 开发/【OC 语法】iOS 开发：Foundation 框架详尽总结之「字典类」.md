> 本文对 Foundation 框架中的字典类（NSDictionary 和 NSMutableDictionary）的使用做一个详细的总结。

<!--more-->

## 1. NSDictionary

### 1.1 NSDictionar 介绍

- Dictionary翻译过来叫做"字典"
- 日常生活中，“字典”的作用：通过一个拼音或者汉字，就能找到对应的详细解释
- NSDictionary的作用类似：通过一个键（key），就能找到对应的值（value）
- NSDictionary中的键（key）是单值，通常是字符串，也可以是其他对象类型
- NSDictionary中和键（key）关联的值（value）可以是任何对象类型，但不能是nil
- NSDictionary是不可变的，一旦初始化完毕，里面的内容就无法修改

### 1.2 NSDictionary 的创建

```objc
+ (instancetype)dictionary;
+ (instancetype)dictionaryWithObject:(id)object forKey:(id <NSCopying>)key;
+ (instancetype)dictionaryWithObjectsAndKeys:(id)firstObject, ...;
+ (id)dictionaryWithContentsOfFile:(NSString *)path;
+ (id)dictionaryWithContentsOfURL:(NSURL *)url;
```

### 1.3 NSDictionary 创建和获取简写

- 以前 NSDictionary 创建方式

```objc
NSDictionary *dict = [NSDictionary dictionaryWithObjectsAndKeys:@"Walkers", @"name", @"12345678", @"phone", @"ZhongGuo", @"address", nil];
NSDictionary *dict = [NSDictionary dictionaryWithObjects:@[@"Walkers",@"30",@"1.75"] forKeys:@[@"name",@"age",@"height"]];

```

- 现在 NSDictionary 创建简写方式

```objc
NSDictionary *dict = @{@"name":@"Walkers", @"phone":@"12345678", @"address":@"ZhongGuo"};
```

- 以前NSDictionary获取元素方式

```objc
[dict objectForKey:@"name”];
```

- 现在NSDictionary获取元素简写方式

```objc
dict[@"name”];
```

### 1.4 键值对集合的特点

- 字典存储的时候，必须是"键值对"的方式来存储(同时键不要重复)
- 键值对中存储的数据是"无序的"
- 键值对集合可以根据键，快速获取数据

### 1.5 NSDictionary 的遍历

- 返回字典的键值对数目`- (NSUInteger)count;`

```objc
NSDictionary *dict = @{@"name":@"Walkers", @"phone":@"12345678", @"address":@"ZhongGuo"};
NSLog(@"count = %lu",[dict count]);

输出结果：count = 3
```

- 根据key取出value`- (id)objectForKey:(id)aKey;`

```objc
NSDictionary *dict = @{@"name":@"Walkers", @"phone":@"12345678", @"address":@"ZhongGuo"};
NSLog(@"%@",[dict objectForKey:@"name"]);

输出结果：Walkers

```

- 快速遍历

```objc

NSDictionary *dict = @{@"name":@"Walkers", @"phone":@"12345678", @"address":@"ZhongGuo"};

for (NSString *key in dict) {
    NSLog(@"key = %@, value = %@", key, dict[key]);
}

输出结果：
key = name, value = Walkers
key = phone, value = 12345678
key = address, value = ZhongGuo
```

- Block遍历

```objc
[dict enumerateKeysAndObjectsUsingBlock:^(NSString *key, NSString *obj, BOOL *stop) {
    NSLog(@"key = %@, value = %@", key, obj);
}];
```

### 1.6 NSDictionary 文件操作

- 将字典写入文件中
    - `- (BOOL)writeToFile:(NSString *)path atomically:(BOOL)useAuxiliaryFile;`
    - `- (BOOL)writeToURL:(NSURL *)url atomically:(BOOL)atomically;`
    - 存储结果是xml文件格式，但苹果官方推荐为plist后缀
- 示例

```objc

NSDictionary *dict = @{@"name":@"Walkers", @"phone":@"12345678", @"address":@"ZhongGuo"};

BOOL flag = [dict writeToFile:@"/Users/Walkers/Desktop/dict.plist" atomically:YES];
NSLog(@"flag = %i", flag);

输出结果：flag = 1
```

文件里的内容显示结果如下图

![1.png](http://qcdn.itcharge.cn/images/iOS-Foundation-Dictionary-001.png)

- 从文件中读取字典

```objc

NSDictionary *newDict = [NSDictionary dictionaryWithContentsOfFile:@"/Users/Walkers/Desktop/dict.plist"];
NSLog(@"newDict = %@", newDict);

```

### 1.7 NSDictionary 和 NSArray 对比

#### 1.7.1 NSDictionary 和 NSArray 的区别

- NSArray是有序的，NSDictionary是无序的
- NSArray是通过下标访问元素，NSDictionary是通过key访问元素

#### 1.7.2 NSDictionary 和 NSArray 的用法

- 创建

```objc
// 数组
@[@"Walkers", @"Rose"] (返回是不可变数组)
// 字典
@{ @"name" : @"Walkers", @"phone" : @"12345678" } (返回是不可变字典)

```

- 访问

```objc
// 数组
id d = array[1];
// 字典
id d = dict[@"name"];

```

- 赋值

```objc
// 数组
array[1] = @"Walkers";
// 字典
dict[@"name"] = @"Walkers";

```

***

## 2. NSMutableDictionary

### 2.1 NSMutableDictionary 介绍

- NSMutableDictionary是NSDictionary的子类
- NSDictionary是不可变的，一旦初始化完毕后，它里面的内容就永远是固定的，不能删除里面的元素，也不能再往里面添加元素
- NSMutableDictionary是可变的，随时可以往里面添加\更改\删除元素

### 2.2 NSMutableDictionary 的常见操作

- 添加/修改一个键值对(如果aKey之前有值，则会把aKey之前对应的值给替换掉)`- (void)setObject:(id)anObject forKey:(id <NSCopying>)aKey;`

```objc

NSMutableDictionary *dict = [NSMutableDictionary  dictionary];

[dict setObject:@"Walkers" forKey:@"name"];
NSLog(@"%@", dict);

输出结果：
{
    name = Walkers;
}
```

```objc
NSMutableDictionary *dict = [NSMutableDictionary  dictionary];

[dict setObject:@"Walkers" forKey:@"name"];
NSLog(@"%@", dict);

[dict setObject:@"abc" forKey:@"name"];
NSLog(@"%@", dict);

输出结果：
{
    name = Walkers;
}
{
    name = abc;
}
```

- 通过aKey删除对应的value`- (void)removeObjectForKey:(id)aKey;`

```objc
NSMutableDictionary *dict = [NSMutableDictionary dictionary];
[dict setValuesForKeysWithDictionary: @{@"name":@"Walkers", @"phone":@"12345678", @"address":@"ZhongGuo"}];

[dict removeObjectForKey:@"name"];
NSLog(@"%@",dict);

输出结果：
{
    address = ZhongGuo;
    phone = 12345678;
}
```

- 删除所有的键值对`- (void)removeAllObjects;`

```objc
NSMutableDictionary *dict = [NSMutableDictionary dictionary];
[dict setValuesForKeysWithDictionary: @{@"name":@"Walkers", @"phone":@"12345678", @"address":@"ZhongGuo"}];

[dict removeAllObjects];
NSLog(@"%@",dict);

输出结果：
{
}
```



### 2.3 NSMutableDictionary 的简写

- 以前设置键值对方式

```objc
[dict setObject:@"Jack" forKey:@"name”];
```

- 现在设置键值对方式

```objc
dict[@"name"] = @"Jack";
```
