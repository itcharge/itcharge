---
title: OC 知识：Foundation 框架详尽总结之『字符串类』
date: 2016-08-06 22:13:37
tags:
    - 技术
    - iOS 开发
categories:
    - 00 - 技术 - iOS 开发
---

> 本文对 Foundation 框架中的字符串类（NSString、NSMutableString）的使用做一个详细的总结。



<!--more-->



# 1. NSString

## 1. NSString介绍

- Foundation框架支持一个名为NSString的类，用于处理字符串对象，由unichar字符组成。
- 一个NSString对象就代表一个字符串（文字内容）
- 一般称NSString为字符串类

## 2. NSString创建方式

1. 通过字符串常量直接创建

  ```objc
  NSString *str = @"abc";
  ```

2. 通过alloc init格式创建

  ```objc
  NSString *str = [[NSString alloc]initWithFormat:@"abc"];
  ```

3. 通过类工厂方法（stringWithFormat）创建

  ```objc
  NSString *str = [NSString stringWithFormat:@"abc"];
  ```

## 3. 字符串读写

- 从文件中读取字符串

```objc
// 用来保存错误信息
NSError *error = nil;

// 读取文件内容
NSString *str = [NSString stringWithContentsOfFile:@"/Users/Walkers/Desktop/test.txt" encoding:NSUTF8StringEncoding error:&error];

// 如果有错误信息
if (error) {
    NSLog(@"读取失败, 错误原因是:%@", [error localizedDescription]);
} else { // 如果没有错误信息
    NSLog(@"读取成功, 文件内容是:\n%@", str);
}

输出结果：读取成功, 文件内容是:abc
```

- 将字符串写入文件中

```objc

NSString *str = @"abc";

BOOL flag = [str writeToFile:@"/Users/Walkers/Desktop/test.txt" atomically:YES encoding:NSUTF8StringEncoding error:nil];
if (flag == 1)
{
    NSLog(@"写入成功");
}

输出结果：写入成功
```

- 重复写入同一文件会覆盖掉上一次的内容

```objc
NSString *str1 = @"abc";
BOOL flag = [str1 writeToFile:@"/Users/Walkers/Desktop/test.txt" atomically:YES encoding:NSUTF8StringEncoding error:nil];

NSString *str2 = @"xyz";
[str2 writeToFile:@"/Users/Walkers/Desktop/test.txt" atomically:YES encoding:NSUTF8StringEncoding error:nil];

NSString *str = [NSString stringWithContentsOfFile:@"/Users/Walkers/Desktop/test.txt" encoding:NSUTF8StringEncoding error:&error];
NSLog(@"str = %@", str);

输出结果: xyz
```

## 4. 使用URL读写字符串

### 1. URL介绍

- URL的全称是Uniform Resource Locator（统一资源定位符）
- URL是互联网上标准资源的地址
- 互联网上的每个资源都有一个唯一的URL，它包含的信息指出资源的位置
- 根据一个URL就能找到唯一的一个资源
- URL的格式
    - 基本URL包含协议、主机域名（服务器名称\IP地址）、路径
    - 举例: https://www.jianshu.com/img/Walkers.gif
    - 可以简单认为: URL == 协议头://主机域名/路径
- 常见的URL协议头(URL类型)
    - https://  或 https:// ：超文本传输协议资源，网络资源
    - ftp:// ：文件传输协议
    - file:// ：本地电脑的文件
- URL的创建
    - 传入完整的字符串创建

    ```objc
    NSURL *url = [NSURL   URLWithString:@"file:///Users/Walkers/Desktop/str.txt"];
    ```

    - 通过文件路径创建（默认就是file协议）

    ```objc
    NSURL *url = [NSURL fileURLWithPath:@"/Users/Walkers/Desktop/str.txt"];
    ```

### 2. 使用NSURL读写字符串

- 从URL中读取

```objc
// 用来保存错误信息
NSError *error = nil;

// 创建URL路径
NSURL *url = [NSURL fileURLWithPath:@"/Users/Walkers/Desktop/test.txt"];

// 读取文件内容
NSString *str = [NSString stringWithContentsOfURL:url encoding:NSUTF8StringEncoding error:&error];

// 如果有错误信息
if (error) {
    NSLog(@"读取失败, 错误原因是:%@", [error localizedDescription]);
} else { // 如果没有错误信息
    NSLog(@"读取成功, 文件内容是:\n%@", str);
}

输出结果：读取成功, 文件内容是:abc
```

- 写入URL中

```objc
NSString *str = @"Walkers";
[str writeToURL:[NSURL URLWithString:@"/Users/Walkers/Desktop/str.txt"] atomically:YES encoding:NSUTF8StringEncoding error:nil];
```

## 5. 字符串比较
### 1. NSString大小写处理
- 全部字符转为大写字母`- (NSString *)uppercaseString;`
- 全部字符转为小写字母`- (NSString *)lowercaseString;`
- 首字母变大写，其他字母都变小写`- (NSString *)capitalizedString;`

### 2. NSString比较

- 比较字符串是否内容一样`- (BOOL)isEqualToString:(NSString *)aString;`
    - 两个字符串的内容相同就返回YES, 否则返回NO。

```objc
NSString *str1 = @"abc";
NSString *str2 = [NSString stringWithFormat:@"abc"];

if ([str1 isEqualToString:str2]) {
    NSLog(@"字符串内容一样");
}

if (str1 == str2) {
    NSLog(@"字符串地址一样");
}
```

- 比较两个字符串内容的大小`- (NSComparisonResult)compare:(NSString *)string;`
    - 比较方法: 逐个字符地进行比较ASCII值，返回NSComparisonResult作为比较结果
    - NSComparisonResult是一个枚举，有3个值:
        - 如果左侧   > 右侧，返回NSOrderedDescending,
        - 如果左侧   < 右侧，返回NSOrderedAscending,
        - 如果左侧  == 右侧，返回NSOrderedSame

```objc
NSString *str1 = @"abc";
NSString *str2 = @"abd";

switch ([str1 compare:str2]) {
    case NSOrderedAscending:
        NSLog(@"后面一个字符串大于前面一个");
        break;
    case NSOrderedDescending:
        NSLog(@"后面一个字符串小于前面一个");
        break;
    case NSOrderedSame:
        NSLog(@"两个字符串一样");
        break;
}

输出结果：后面一个字符串大于前面一个
```

- 忽略大小写进行比较`(NSComparisonResult) caseInsensitiveCompare:(NSString *)string;`
    - 返回值与compare:一致

```objc
NSString *str1 = @"abc";
NSString *str2 = @"ABC";

switch ([str1 caseInsensitiveCompare:str2]) {
    case NSOrderedAscending:
        NSLog(@"后面一个字符串大于前面一个");
        break;
    case NSOrderedDescending:
        NSLog(@"后面一个字符串小于前面一个");
        break;
    case NSOrderedSame:
        NSLog(@"两个字符串一样");
        break;
}

输出结果：两个字符串一样
```



## 6. 字符串搜索

- 是否以aString开头`- (BOOL)hasPrefix:(NSString *)aString;`

```objc
NSString *str = @"https://jianshu.com/img/Walkers.gif";

if ([str hasPrefix:@"https://"]) {
    NSLog(@"包含https://");
} else {
    NSLog(@"不包含https://");
}

输出结果：包含https://
```

- 是否以aString结尾`- (BOOL)hasSuffix:(NSString *)aString;`

```objc
NSString *str = @"https://jianshu.com/img/Walkers.gif";

if ([str hasSuffix:@".gif"]) {
    NSLog(@"动态图片");
} else {
    NSLog(@"不是动态图片");
}

输出结果：动态图片
```

- 检查字符串内容中是否包含了aString`- (NSRange)rangeOfString:(NSString *)aString;`
    - 如果包含, 就返回aString的范围
    - 如果不包含, NSRange的location为NSNotFound, length为0

```objc
NSString *str = @"https://jianshu.com/img/Walkers.gif";
NSRange range = [str rangeOfString:@"Walkers"];

if (range.location == NSNotFound) {
    NSLog(@"str中没有需要查找的字符串");
} else {
    NSLog(@"str中有需要查找的字符串");
    NSLog(@"location = %lu, length = %lu", range.location, range.length);
}

输出结果：
str中有需要查找的字符串
location = 23, length = 7
```

## 7. 字符串的截取

- 从指定位置from开始(包括指定位置的字符)到尾部`- (NSString *)substringFromIndex:(NSUInteger)from;`

```objc
NSString *str = @"<head>程序员</head>";
str = [str substringFromIndex:6];
NSLog(@"str = %@", str);

输出结果: 程序员</head>
```

- 从字符串的开头一直截取到指定的位置to，但不包括该位置的字符`- (NSString *)substringToIndex:(NSUInteger)to;` 

```objc
NSString *str = @"<head>程序员</head>";
str = [str substringToIndex:6];
NSLog(@"str = %@", str);

输出结果: <head>
```

- 按照所给出的NSRange从字符串中截取子串`- (NSString *)substringWithRange:(NSRange)range;`

```objc
NSString *str = @"<head>程序员</head>";
NSRange range;
/*
range.location = 6;
range.length = 3;
*/
range.location = [str rangeOfString:@">"].location + 1;
range.length = [str rangeOfString:@"</"].location - range.location;

NSString *res = [str substringWithRange:range];
NSLog(@"res = %@", res);

输出结果: 程序员
```

## 8. 字符串的替换函数

- 用replacement替换target `- (NSString *)stringByReplacingOccurrencesOfString:(NSString *)target withString:(NSString *)replacement;`

```objc
NSString *str = @"https:**jianshu.com*img*Walkers.gif";
NSString *newStr = [str stringByReplacingOccurrencesOfString:@"*" withString:@"/"];
NSLog(@"newStr = %@", newStr);

输出结果: newStr = https://jianshu.com/img/Walkers.gif
```



- 去除首尾 `- (NSString *)stringByTrimmingCharactersInSet:(NSCharacterSet *)set;`
    - 去除首尾的" "

    ```objc
    NSString *str =  @"   https://jianshu.com/img/Walkers.gif   ";
    NSString *newStr = [str stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
    NSLog(@"str =|%@|", str);
    NSLog(@"newStr =|%@|", newStr);
    
    输出结果:
    str =|   https://jianshu.com/img/Walkers.gif   |
    newStr =|https://jianshu.com/img/Walkers.gif|
    ```

    - 去除首尾的"*"

    ```objc
    NSString *str =  @"***https://jianshu.com/img/Walkers.gif***";    
    NSString *newStr = [str stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@"*"]];
    NSLog(@"str =|%@|", str);
    NSLog(@"newStr =|%@|", newStr);

    输出结果: 
    str =|***https://jianshu.com/img/Walkers.gif***|
    newStr =|https://jianshu.com/img/Walkers.gif|
    ```

## 9. NSString与路径

- 是否为绝对路径`- (BOOL)isAbsolutePath;`

```objc
// 其实就是判断是否以/开头
//    NSString *str = @"/Users/Walkers/Desktop/test.txt";    // 绝对路径
NSString *str = @"Users/Walkers/Desktop/test.txt";       // 不是绝对路径
if ([str isAbsolutePath]) {
    NSLog(@"是绝对路径");
}else {
    NSLog(@"不是绝对路径");
}

输出结果：不是绝对路径
```

- 获得最后一个目录`- (NSString *)lastPathComponent;`

```objc
// 截取最后一个/后面的内容
NSString *str = @"/Users/Walkers/Desktop/test.txt";
NSString *component = [str lastPathComponent];
NSLog(@"component = %@", component);

输出结果：component = test.txt
```

- 删除最后一个目录`- (NSString *)stringByDeletingLastPathComponent;`

```objc
// 其实就是删除最后一个/和之后的内容
NSString *str = @"/Users/Walkers/Desktop/test.txt";
NSString *newStr = [str stringByDeletingLastPathComponent];
NSLog(@"newStr = %@", newStr);

输出结果：newStr = /Users/Walkers/Desktop
```

- 在路径的后面拼接一个目录`- (NSString *)stringByAppendingPathComponent:(NSString *)str;`
    - 也可以使用`stringByAppendingString:`或者`stringByAppendingFormat:`拼接字符串内容

```objc
// 其实就是在最后面加上/和要拼接得内容
// 注意会判断后面有没有/有就不添加了, 没有就添加, 并且如果有多个会替换为1个
//    NSString *str = @"/Users/Walkers/Desktop";
NSString *str = @"/Users/Walkers/Desktop/";
NSString *newStr = [str stringByAppendingPathComponent:@"abc"];
NSLog(@"newStr = %@", newStr);

输出结果：newStr = /Users/Walkers/Desktop/abc
```

## 10. NSString与文件拓展名

- 获得拓展名`- (NSString *)pathExtension;`

```objc
// 其实就是从最后面开始截取.之后的内容
//    NSString *str = @"test.txt";
NSString *str = @"abc.test.txt";
NSString *extension = [str pathExtension];
NSLog(@"extension = %@", extension);

输出结果：extension = txt
```

- 删除尾部的拓展名`- (NSString *)stringByDeletingPathExtension;`

```objc
// 其实就是删除从最后面开始.之后的内容
//    NSString *str = @"test.txt";
NSString *str = @"abc.test.txt";
NSString *newStr = [str stringByDeletingPathExtension];
NSLog(@"newStr = %@", newStr);

输出结果：newStr = abc.test
```

-  在尾部添加一个拓展名`- (NSString *)stringByAppendingPathExtension:(NSString *)str;`

```objc
// 其实就是在最后面拼接上.和指定的内容
NSString *str = @"abc";
NSString *newStr = [str stringByAppendingPathExtension:@"gif"];
NSLog(@"newStr = %@", newStr);

输出结果：newStr = abc.gif
```

## 11. 获取字符串的每个字符

- 返回字符串的长度(有多少个文字)`- (NSUInteger)length;`
- 返回index位置对应的字符`- (unichar)characterAtIndex:(NSUInteger)index;`

## 12. 字符串大小写转换

- 将字符串转换为大写

```objc
NSString *str = @"abc";
NSString *newStr = [str uppercaseString];
NSLog(@"%@", newStr);

输出结果：ABC
```

- 将字符串转换为小写

```objc
NSString *str = @"ABC";
NSString *newStr2 = [str lowercaseString];
NSLog(@"%@", newStr2);

输出结果：abc

```

- 将字符串的首字符转换为大写

```objc
NSString *str = @"abc";
NSString *newStr = [str capitalizedString];
NSLog(@"%@", newStr);

输出结果：Abc
```

## 13. 字符串和其他数据类型转换

- 字符串转为基本数据类型
    - `- (double)doubleValue;`
    - `- (float)floatValue;`
    - `- (int)intValue;`

```objc
NSString *str1 = @"110";
NSString *str2 = @"10";
int res = str1.intValue + str2.intValue;
NSLog(@"res = %i", res);
```

```objc
NSString *str1 = @"110";
NSString *str2 = @"10.1";
double res = str1.doubleValue + str2.doubleValue;
NSLog(@"res = %f", res);
```

- 字符串转为C语言中的字符串`- (char *)UTF8String;`

```objc
NSString *str = @"abc";
const char *cStr = [str UTF8String];
NSLog(@"cStr = %s", cStr);
```

```objc
char *cStr = "abc";
NSString *str = [NSString stringWithUTF8String:cStr];
NSLog(@"str = %@", str);
```

***

# 2. NSMutableString

## 1. NSMutableString介绍

- NSMutableString 类继承NSString类，那么NSString提供的方法在NSMutableString中基本都可以使用，NSMutableString好比一个字符串链表，它可以任意的动态在字符串中添加字符串、删除字符串、在指定位置插入字符串，使用它来操作字符串会更加灵活。
- NSMutableString和NSString的区别
    - NSString是不可变的，里面的文字内容是不能进行修改的
    - NSMutableString是可变的，里面的文字内容可以随时更改
    - NSMutableString能使用NSString的所有方法

## 2. 字符串中的可变和不可变

- 不可变：指的是字符串在内存中占用的存储空间固定，并且存储的内容不能发生变化

```objc
// 改变了指针的指向, 并没有修改字符串
NSString *str = @"abc";    // 一开始str指向@"abc"对应的内存
str = @"xyz";    //修改了str指针的指向，让它指向@"xyz"对应的内存

// 生成了一个新的字符串, 并没有修改字符串
NSString *newStr = [str substringFromIndex:1];

NSLog(@"str = %@", str);
NSLog(@"newStr = %@", newStr);

输出结果：
str = xyz
newStr = yz
```

执行完`NSString *str = @"abc";`后在内存中的表现如下图所示，str指向@"abc"对应的内存

![1.png](http://qncdn.bujige.net/images/iOS-Foundation-String-001.png)

执行完`str = @"xyz";`后在内存中的表现如下图所示，该语句修改了str指针的指向，让它指向@"xyz"对应的内存

![2.png](http://qncdn.bujige.net/images/iOS-Foundation-String-002.png)

执行完`NSString *newStr = [str substringFromIndex:1];`，在内存中的表现如下图所示，该语句生成了一个新的字符串，并没有修改原有字符串

![3.png](http://qncdn.bujige.net/images/iOS-Foundation-String-003.png)

- 可变：指的是字符串在内存中占用的存储空间可以不固定，并且存储的内容可以被修改

```objc
NSMutableString *str = [NSMutableString string];
NSLog(@"str = %@", str);    

// 修改原有字符串, 没有生成新的字符串
[str appendString:@"abc"];
NSLog(@"str = %@", str);    

[str appendString:@" xyz"];    
NSLog(@"str = %@", str);

```

执行完`NSMutableString *str = [NSMutableString string];`后，在内存中的表现如下图所示

![4.png](http://qncdn.bujige.net/images/iOS-Foundation-String-004.png)

执行完`[str appendString:@"abc"];`后，在内存中的表现如下图所示，该语句修改了原有字符串，并没有生成新的字符串

![5.png](http://qncdn.bujige.net/images/iOS-Foundation-String-005.png)

接着执行`[str appendString:@" xyz"];`后，在内存中的表现如下图所示，该语句同样修改了原有字符串，并没有生成新的字符串

![6.png](http://qncdn.bujige.net/images/iOS-Foundation-String-006.png)

## 3. NSMutableString常用方法

- 拼接aString到字符串最后面`- (void)appendString:(NSString *)aString;`

```objc
NSMutableString *str = [NSMutableString stringWithFormat:@"https://jianshu.com/img/Walkers"];
NSLog(@"str = %@", str);

[str appendString:@".gif"];
NSLog(@"str = %@", str);

输出结果：
str = https://jianshu.com/img/Walkers
str = https://jianshu.com/img/Walkers.gif
```

- 拼接一段格式化字符串到最后面`- (void)appendFormat:(NSString *)format, ...;`

```objc
NSMutableString *str = [NSMutableString stringWithFormat:@"Walkers"];    
[str appendFormat:@" age is %i", 23];
NSLog(@"str = %@", str);

输出结果：str = Walkers age is 23
```

- 删除range范围内的字符串`- (void)deleteCharactersInRange:(NSRange)range;`

```objc
NSMutableString *str = [NSMutableString stringWithFormat:@"https://jianshu.com/img/Walkers"];  

// 一般情况下利用rangeOfString和deleteCharactersInRange配合删除指定内容
NSRange range = [str rangeOfString:@"https://"];    
[str deleteCharactersInRange:range];    

NSLog(@"str = %@", str);

输出结果：str = jianshu.com/img/Walkers
```

- 在loc这个位置中插入aString`- (void)insertString:(NSString *)aString atIndex:(NSUInteger)loc;`

```objc
NSMutableString *str = [NSMutableString stringWithFormat:@"jianshu.com/img/Walkers"];    
[str insertString:@"https://" atIndex:0];   
NSLog(@"str = %@", str);

输出结果：str = https://jianshu.com/img/Walkers
```

- 使用aString替换range范围内的字符串`- (void)replaceCharactersInRange:(NSRange)range withString:(NSString *)aString;`

```objc
NSMutableString *str = [NSMutableString stringWithFormat:@"https://jianshu.com/img/Walkers.gif"];    
NSRange range = [str rangeOfString:@"Walkers"];    

[str replaceOccurrencesOfString:@"Walkers" withString:@"abc" options:0 range:range];    
NSLog(@"str = %@", str);

输出结果：str = https://jianshu.com/img/abc.gif
```

## 4. 字符串使用注意事项

- `@"abc"`这种方式创建的字符串始终是NSString，不是NSMutalbeString。所以下面的代码创建的还是NSString，此时使用可变字符串的函数，无法操作字符串。

```objc
NSMutableString *s1 = @"abc";
 [strM insertString:@"my name is " atIndex:0];    // 会报错
```
