> 本文对 Foundation 框架中一些数字类（NSNumber）、常用结构体类（CGPoint、CGSize、CGRect、CGRange 和 NSValue）、日期类（NSDate、NSCalendar）和文件类（NSFileManager）的使用做一个详细的总结。

<!--more-->

## 1.数字类（NSNumber）

### 1.1 NSNumber 介绍

- NSArray\NSDictionary中只能存放OC对象，不能存放int\float\double等基本数据类
- 如果需要使用将基本数据的值作为对象使用，比如说放进数组或字典中，需要先将基本数据类型包装成OC对象，可使用NSNumber类
- NSNumber可以根据基本数据的类型创建对象，这样就可以间接将基本数据类型存进NSArray\NSDictionary中

### 1.2 NSNumber 的创建

- 以前 NSNumber 的创建方式

```objc
- (NSNumber *)numberWithInt:(int)value;
- (NSNumber *)numberWithDouble:(double)value;
- (NSNumber *)numberWithBool:(BOOL)value;
```

- 示例

```objc
int age = 10;
double number= 5.1;
int value =  6;

// 将基本数据类型转换为对象类型
NSNumber *ageN = [NSNumber numberWithInt:age];
NSNumber *numberN = [NSNumber numberWithDouble:number];
NSNumber *valueN = [NSNumber numberWithInt:value];
```
- 现在 NSNumber 的创建方式

```objc
@10;
@5.1;
@YES;
@(num);
```

- 示例

```objc
NSNumber *ageN = @10;
NSNumber *numberN = @5.1;
NSNumber *valueN = @6;
NSNumber *flag = @YES;
```

### 1.3 从 NSNumber 对象中的到基本类型数据

```objc
- (char)charValue;
- (int)intValue;
- (long)longValue;
- (double)doubleValue;
- (BOOL)boolValue;
- (NSString *)stringValue;
- (NSComparisonResult)compare:(NSNumber *)otherNumber;
- (BOOL)isEqualToNumber:(NSNumber *)number;
```

- 示例

```objc
NSNumber *ageN = @10;

// 2.将对象类型转换为基本数据类型
int age = [ageN intValue];
NSLog(@"age = %d", age);

输出结果：age = 10
```

### 1.4 NSNumber 判断大小

- 判断两个数相等`- (BOOL)isEqualToNumber:(NSNumber *)number;`

```objc
NSNumber *num1 = @10;
NSNumber *num2 = @10;

if ([num1 isEqualToNumber:num2] == YES) {
    NSLog(@"num1 == num2");
} else {
    NSLog(@"num1 != num2")
}

输出结果：num1 == num2
```
- 判断一个数是否相等、小于或大于另一个数`- (NSComparisonResult)compare:(NSNumber *)otherNumber;`

```objc
NSNumber *num1 = @20;
NSNumber *num2 = @10;

if ([num1 compare:num2] == NSOrderedSame) {     // 相等
    NSLog(@"num1 == num2");
} else if ([num1 compare:num2] == NSOrderedAscending) { // 小于
    NSLog(@"num1 < num2");
} else if ([num1 compare:num2] == NSOrderedDescending) { // 大于
    NSLog(@"num1 > num2");
}

输出结果：num1 > num2
```

## 2. 结构体类（CGPoint、CGSize、CGRect、CGRange和NSValue）

### 2.1 结构体介绍

- 在iOS开发中，我们经常会用到一些结构体，比如定义矩形原点坐标的结构体CGPoint、定义矩形尺寸的结构体CGSize、同时定义矩形原点和尺寸的结构体CGRect、描述位置和大小范围的结构体NSRange等。

### 2.2 NSPoint 和 CGPoint

- CGPoint和NSPoint是同义的
- CGPoint代表的是二维平面中的一个点
- CGPoint有2个成员
    - CGFloat x：表示该矩形原点的横坐标位置
    - CGFloat y：表示该矩形原点的纵坐标位置

```objc
typedef CGPoint NSPoint;
// CGPoint的定义
struct CGPoint {
  CGFloat x;
  CGFloat y;
};
typedef struct CGPoint CGPoint;
typedef double CGFloat;
```

- 可以使用CGPointMake和NSMakePoint函数创建CGPoint

```objc
CGPoint point = CGPointMake(10.0, 10.0);
```

### 2.3 NSSize 和 CGSize

- CGSize 和 NSSize 是同义的
- CGSize 代表的是二维平面中的某个物体的尺寸(宽度和高度)
- CGSize 有 2 个成员
    - CGFloat width：表示该矩形尺寸的宽
    -  CGFloat height：表示该矩形尺寸的高

```objc
typedef CGSize NSSize;
// CGSize的定义
struct CGSize {
  CGFloat width;
  CGFloat height;
};
typedef struct CGSize CGSize;
```

- 可以使用CGSizeMake和NSMakeSize函数创建CGSize

```objc
CGSize size =  CGSizeMake(20.0, 20.0);
```

### 2.4 NSRect 和 CGRect

- CGRect和NSRect是同义的
- CGRect代表的是二维平面中的某个物体的位置和尺寸
- CGRect有2个成员
    - CGPoint origin：表示该矩形原点
    - CGSize sizet：表示该矩形尺寸

```objc
typedef CGRect NSRect;
// CGRect的定义
struct CGRect {
  CGPoint origin;
  CGSize size;
};
typedef struct CGRect CGRect;
```

- 可以使用CGRectMake和NSMakeRect函数创建CGRect

```objc
CGRect rect = CGRectMake(10.0, 10.0, 20.0, 20.0);
```

### 2.5 NSRange

- 没有CGRange
- NSRange表示事物的一个范围，通常是字符串里的字符范围或者数组里的元素范围
- NSRange有2个成员
    - NSUInteger location : 表示该范围的起始位置
    - NSUInteger length : 表示该范围内的长度
- 比如@“I love you”中的@“you”可以用location为7，length为3的范围来表示

```objc
// NSRange定义
typedef struct _NSRange {
    NSUInteger location;
    NSUInteger length;
} NSRange;
```

- 可以使用NSMakeRange函数创建NSRange，也可以直接创建

```objc
// 方式1
NSRange range;
range.location = 7;
range.length = 3;

// 方式2
NSRange range = {7, 3};
或者
NSRange range = {.location = 7,.length = 3};

// 方式3 : 使用NSMakeRange函数
NSRange range = NSMakeRange(7, 3);
```

### 2.6 NSValue

- 我们有时候需要将结构体存储在集合中，但不能直接坐到。
- Foundation提供了NSValue类将结构体转换为对象，并把它存储在集合中。
- 将结构体包装成NSValue对象

```objc
+ (NSValue *)valueWithPoint:(NSPoint)point;
+ (NSValue *)valueWithSize:(NSSize)size;
+ (NSValue *)valueWithRect:(NSRect)rect;
```

- 示例

```objc
CGPoint point = NSMakePoint(10, 20);

NSValue *value = [NSValue valueWithPoint:point];
NSArray *arr = @[value];
NSLog(@"%@", arr);

输出结果：
(
    "NSPoint: {10, 20}"
)
```

- 从NSValue对象取出之前包装的结构体

```objc
- (NSPoint)pointValue;
- (NSSize)sizeValue;
- (NSRect)rectValue;
```

- 示例

```objc
CGPoint point = NSMakePoint(10, 20);

NSValue *value = [NSValue valueWithPoint:point];
CGPoint getPoint = [value pointValue];
NSLog(@"%lf %lf",getPoint.x,getPoint.y);

输出结果：10.000000 20.000000
```

- 用NSValue对象包装任意数据
    - value参数：所包装数据的地址
    - type参数：用来描述这个数据类型的字符串，用@encode指令来生成

```objc
+ (NSValue *)valueWithBytes:(const void *)value objCType:(const char *)type;
```

- 从NSValue中取出所包装的任意数据

```objc
- (void)getValue:(void *)value;
```

- 示例

```objc
// 1.利用NSValue包装自定义的结构体
typedef struct{
    int age;
    char *name;
    double height;
}Person;
Person p = {20, "abc", 1.75};

// valueWithBytes: 接收一个指针, 需要传递需要包装的结构体的变量的地址
// objCType: 需要传递需要包装的数据类型
NSValue *value = [NSValue valueWithBytes:&p objCType:@encode(Person)];

// 2.从NSValue中取出自定义的结构体变量
Person res;
[value getValue:&res];
NSLog(@"age = %i, name = %s, height = %f", res.age, res.name, res.height);

输出结果：age = 20, name = abc, height = 1.750000
```

## 3. 日期类（NSDate、NSCalendar）

### 3.1 NSDate

- NSDate可以用来表示时间，可以进行一些常见的日期\时间处理
- 一个NSDate对象就代表一个时间
- [NSDate date]返回的就是当前时间，注意此时间是世界标准时间，准确时间应加上当前时区与世界标准时间的偏移量

```objc
NSDate *now = [NSDate date];  // 未偏移量的当前时间
NSLog(@"now = %@", now);  

// 获取当前所处的时区
NSTimeZone *zone = [NSTimeZone systemTimeZone];
// 获取当前时区和指定时区的时间差
NSInteger seconds = [zone secondsFromGMTForDate:now];
// 得到准确时间    
NSDate *newDate = [now dateByAddingTimeInterval:seconds];
NSLog(@"newDate = %@", newDate);

输出结果：
now = 2016-08-07 01:42:44 +0000
newDate = 2016-08-07 09:42:44 +0000
```

- 格式化日期`NSDate -> NSString`

```objc
// 创建时间
NSDate *now = [NSDate date];
// 创建时间格式化
NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
// 指定格式
// yyyy：年 
// MM：月 
// dd：日
// HH：24小时 hh：12小时
// mm：分 
// ss：秒
// Z：时区
formatter.dateFormat = @"yyyy-MM-dd HH:mm:ss";
// 格式化时间
NSString *str = [formatter stringFromDate:now];
NSLog(@"%@", str);

输出结果：2016-08-07 09:44:54
```

- 格式化日期`NSString -> NSDate`

```objc
NSString *str = @"2015-06-28 19:53:24";
NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
formatter.dateFormat = @"yyyy-MM-dd HH:mm:ss";
NSDate *date = [formatter dateFromString:str];
NSLog(@"%@", date);

输出结果：2015-06-28 11:53:24 +0000
```

### 3.2 NSCalendar

- 结合NSCalendar和NSDate能做更多的日期\时间处理
- 获得NSCalendar对象`NSCalendar *calendar = [NSCalendar currentCalendar];`

- 获得年月日`- (NSDateComponents *)components:(NSCalendarUnit)unitFlags fromDate:(NSDate *)date;`

```objc
NSDate *date = [NSDate date];
// 创建日历对象
NSCalendar *calendar = [NSCalendar currentCalendar];
// 利用日历对象获取年月日时分秒，将需要获取的类型并入NSCalendarUnit中
NSCalendarUnit type = NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond;
NSDateComponents *cmps =[calendar components:type fromDate:date];
NSLog(@"year = %lu", cmps.year);
NSLog(@"month = %lu", cmps.month);
NSLog(@"day = %lu", cmps.day);
NSLog(@"hour = %lu", cmps.hour);
NSLog(@"minute = %lu", cmps.minute);
NSLog(@"second = %lu", cmps.second);
NSLog(@"date = %@", date);

输出结果：
year = 2016
month = 8
day = 7
hour = 9
minute = 57
second = 35
date = 2016-08-07 01:57:35 +0000
```

- 比较两个日期的差距`- (NSDateComponents *)components:(NSCalendarUnit)unitFlags fromDate:(NSDate *)startingDate toDate:(NSDate *)resultDate options:(NSCalendarOptions)opts;`

```objc
// 确定时间
NSString *time1 = @"2016-06-23 12:18:15";
NSString *time2 = @"2016-06-28 10:10:10";
// 将时间转换为date
NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
formatter.dateFormat = @"yyyy-MM-dd HH:mm:ss";
NSDate *date1 = [formatter dateFromString:time1];
NSDate *date2 = [formatter dateFromString:time2];
// 创建日历
NSCalendar *calendar = [NSCalendar currentCalendar];
NSCalendarUnit type = NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond;
// 利用日历对象比较两个时间的差值
NSDateComponents *cmps = [calendar components:type fromDate:date1 toDate:date2 options:0];
// 输出结果
NSLog(@"两个时间相差%ld年%ld月%ld日%ld小时%ld分钟%ld秒", cmps.year, cmps.month, cmps.day, cmps.hour, cmps.minute, cmps.second);

输出结果：两个时间相差0年0月4日21小时51分钟55秒
```

## 4. 文件类（NSFileManager）

### 4.1 NSFileManager 介绍

- NSFileManager是用来管理文件系统的
- 它可以用来进行常见的文件\文件夹操作

### 4.2 NSFileManager 用法

- 判断path这个文件\文件夹是否存在`- (BOOL)fileExistsAtPath:(NSString *)path;`

```objc
NSFileManager *manager = [NSFileManager defaultManager];

// 可以判断文件
BOOL flag = [manager fileExistsAtPath:@"/Users/Walkers/Desktop/test.txt"];
NSLog(@"flag = %i", flag);

// 可以判断文件夹
flag = [manager fileExistsAtPath:@"/Users/Walkers/Desktop/未命名文件夹"];
NSLog(@"flag = %i", flag);
```

- 判断path这个文件\文件夹是否存在，isDirectory代表是否为文件夹`- (BOOL)fileExistsAtPath:(NSString *)path isDirectory:(BOOL *)isDirectory;`

```objc
NSFileManager *manager = [NSFileManager defaultManager];
BOOL directory = NO;
BOOL flag = [manager fileExistsAtPath:@"/Users/Walkers/Desktop/未命名文件夹" isDirectory:&directory];
NSLog(@"flag = %i, directory = %i", flag, directory);
```

- 判断path这个文件\文件夹是否可读`- (BOOL)isReadableFileAtPath:(NSString *)path;` 

- path这个文件\文件夹是否可写`- (BOOL)isWritableFileAtPath:(NSString *)path;`
    - 系统目录不允许写入

- path这个文件\文件夹是否可删除`- (BOOL)isDeletableFileAtPath:(NSString *)path;`
    - 系统目录不允许删除

### 4.3 NSFileManager 的文件访问

- 获得path这个文件\文件夹的属性`- (NSDictionary *)attributesOfItemAtPath:(NSString *)path error:(NSError **)error;`

    ```objc
	NSFileManager *manager = [NSFileManager defaultManager];
	NSDictionary *dict = [manager attributesOfItemAtPath:@"/Users/Walkers/Desktop/test.txt" error:nil];
	NSLog(@"dit = %@", dict);
	```

- 获得path的当前子路径`- (NSArray *)contentsOfDirectoryAtPath:(NSString *)path error:(NSError **)error;`

- 获得文件内容`- (NSData *)contentsAtPath:(NSString *)path;`

```objc
NSFileManager *manager = [NSFileManager defaultManager];
NSArray *paths = [manager contentsOfDirectoryAtPath:@"/Users/Walkers/Desktop/" error:nil];
NSLog(@"paths = %@", paths);
```

- 获得path的所有子路径
    - `- (NSArray *)subpathsAtPath:(NSString *)path;`
    - `- (NSArray *)subpathsOfDirectoryAtPath:(NSString *)path error:(NSError **)error;`

    ```objc
    NSFileManager *manager = [NSFileManager defaultManager];
    NSArray *paths = [manager subpathsAtPath:@"/Users/Walkers/Desktop/"];
    NSLog(@"paths = %@", paths);
    ```

### 4.4 NSFileManager 的文件操作

- 拷贝`- (BOOL)copyItemAtPath:(NSString *)srcPath toPath:(NSString *)dstPath error:(NSError **)error;`

- 移动(剪切)`- (BOOL)moveItemAtPath:(NSString *)srcPath toPath:(NSString *)dstPath error:(NSError **)error;`

- 删除`- (BOOL)removeItemAtPath:(NSString *)path error:(NSError **)error;`

- 创建文件夹(createIntermediates为YES代表自动创建中间的文件夹)`- (BOOL)createDirectoryAtPath:(NSString *)path withIntermediateDirectories:(BOOL)createIntermediates attributes:(NSDictionary *)attributes error:(NSError **)error;`

```objc
NSFileManager *manager = [NSFileManager defaultManager];
BOOL flag = [manager createDirectoryAtPath:@"/Users/Walkers/Desktop/test" withIntermediateDirectories:YES attributes:nil error:nil];
NSLog(@"flag = %i", flag);
```
- 创建文件(NSData是用来存储二进制字节数据的)`- (BOOL)createFileAtPath:(NSString *)path contents:(NSData *)data attributes:(NSDictionary *)attr;`

```objc
NSString *str = @"abc";
NSData  *data = [str dataUsingEncoding:NSUTF8StringEncoding];
NSFileManager *manager = [NSFileManager defaultManager];
BOOL flag = [manager createFileAtPath:@"/Users/Walkers/Desktop/abc.txt" contents:data attributes:nil];
NSLog(@"flag = %i", flag);
```
