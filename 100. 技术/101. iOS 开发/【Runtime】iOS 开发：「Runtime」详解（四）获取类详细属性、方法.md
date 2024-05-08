> 本文用来介绍  iOS 开发中，**如何通过「Runtime」获取类详细属性、方法**。通过本文，您将了解到：
> 1. 获取类详细属性、方法简述
> 2. 获取类详细属性、方法（成员变量列表、属性列表、方法列表、所遵循的协议列表）
> 3. 应用场景
>   3.1  修改私有属性
>   3.2 万能控制器跳转
>   3.3 实现字典转模型
>   3.4 改进 iOS 归档和解档
>
> 文中示例代码在： [itcharge](https://github.com/itcharge) / **[YSC-Class-DetailList-Demo](https://github.com/itcharge/YSC-Class-DetailList-Demo)**


<!--more-->

---

![](http://qcdn.itcharge.cn/images/iOS-Runtime-04-001.png)




# 1. 获取类详细属性、方法简述

在苹果官方为我们提供的类中，只能获取一小部分公开的属性和方法。有些我们恰好需要的属性和方法，可能会被官方隐藏了起来，没有直接提供给我们。

那应该如何才能获取一个类中所有的变量和方法，用来查找是否有对我们有用的变量和方法呢？

幸好 Runtime 中为我们提供了一系列 API 来获取 Class （类）的 **成员变量（ Ivar ）、属性（ Property ）、方法（ Method ）、协议（ Protocol ）** 等。我们可以通过这些方法来遍历一个类中的成员变量列表、属性列表、方法列表、协议列表。从而查找我们需要的变量和方法。

比如说遇到这样一个需求：更改 UITextField 占位文字的颜色和字号。实现代码参考  3.1 修改私有属性 中的例子。

下面我们先来讲解一下如何通过代码获取类详细属性、方法。

---

#  2. 获取类详细属性、方法

> 注意：头文件中需引入 `#import <objc/runtime.h>`。

## 2.1 获取类的成员变量列表

```Objc
// 打印成员变量列表
- (void)printIvarList {
    unsigned int count;
    
    Ivar *ivarList = class_copyIvarList([self class], &count);
    for (unsigned int i = 0; i < count; i++) {
        Ivar myIvar = ivarList[i];
        const char *ivarName = ivar_getName(myIvar);
        NSLog(@"ivar(%d) : %@", i, [NSString stringWithUTF8String:ivarName]);
    }
    
    free(ivarList);
}
```


## 2.2 获取类的属性列表

```Objc
// 打印属性列表
- (void)printPropertyList {
    unsigned int count;
    
    objc_property_t *propertyList = class_copyPropertyList([self class], &count);
    for (unsigned int i = 0; i < count; i++) {
        const char *propertyName = property_getName(propertyList[i]);
        NSLog(@"propertyName(%d) : %@", i, [NSString stringWithUTF8String:propertyName]);
    }
    
    free(propertyList);
}
```

## 2.3 获取类的方法列表

```Objc
// 打印方法列表
- (void)printMethodList {
    unsigned int count;
    
    Method *methodList = class_copyMethodList([self class], &count);
    for (unsigned int i = 0; i < count; i++) {
        Method method = methodList[i];
        NSLog(@"method(%d) : %@", i, NSStringFromSelector(method_getName(method)));
    }
    
    free(methodList);
}
```

## 2.4 获取类所遵循的协议列表

```Objc
// 打印协议列表
- (void)printProtocolList {
    unsigned int count;
    
    __unsafe_unretained Protocol **protocolList = class_copyProtocolList([self class], &count);
    for (unsigned int i = 0; i < count; i++) {
        Protocol *myProtocal = protocolList[i];
        const char *protocolName = protocol_getName(myProtocal);
        NSLog(@"protocol(%d) : %@", i, [NSString stringWithUTF8String:protocolName]);
    }
    
    free(protocolList);
}
```

---

# 3. 应用场景

## 3.1  修改私有属性 

> 需求：更改 UITextField 占位文字的颜色和字号

先来想想又几种做法：

> 方法 1：通过 attributedPlaceholder 属性修改


我们知道 UITextField 中有 placeholder 属性和 attributedPlaceholder 属性。通过 placeholder 属性只能更改占位文字，无法修改占位文字的字体和颜色。而通过 attributedPlaceholder 属性我们就可以修改 UITextField 占位文字的颜色和字号了。

> 方法 2：重写 UITextField 的 drawPlaceholderInRect: 方法修改

实现步骤：
1. 自定义一个 XXTextField 继承自 UITextField；
2. 重写自定义 XXTextField 的 drawPlaceholderInRect: 方法；
3. 在 drawPlaceholderInRect 方法中设置 placeholder 的属性。

```Objc
- (void)drawPlaceholderInRect:(CGRect)rect {
    
    // 计算占位文字的 Size
    NSDictionary *attributes = @{
                                 NSForegroundColorAttributeName : [UIColor lightGrayColor],
                                 NSFontAttributeName : [UIFont systemFontOfSize:15]
                                 };
    CGSize placeholderSize = [self.placeholder sizeWithAttributes:attributes];
    
    [self.placeholder drawInRect:CGRectMake(0, (rect.size.height - placeholderSize.height)/2, rect.size.width, rect.size.height) withAttributes: attributes];
}
```

> 方法 3：利用 Runtime，找到并修改 UITextfield 的私有属性

实现步骤：
1. 通过获取类的属性列表和成员变量列表的方法打印 UITextfield 所有属性和成员变量；
2. 找到私有的成员变量 `_placeholderLabel`；
3. 利用 KVC 对 `_placeholderLabel` 进行修改。

```Objc
// 打印 UITextfield 的所有属性和成员变量
- (void)printUITextFieldList {
    unsigned int count;
    
    Ivar *ivarList = class_copyIvarList([UITextField class], &count);
    for (unsigned int i = 0; i < count; i++) {
        Ivar myIvar = ivarList[i];
        const char *ivarName = ivar_getName(myIvar);
        NSLog(@"ivar(%d) : %@", i, [NSString stringWithUTF8String:ivarName]);
    }
    
    free(ivarList);
    
    objc_property_t *propertyList = class_copyPropertyList([UITextField class], &count);
    for (unsigned int i = 0; i < count; i++) {
        const char *propertyName = property_getName(propertyList[i]);
        NSLog(@"propertyName(%d) : %@", i, [NSString stringWithUTF8String:propertyName]);
    }
    
    free(propertyList);
}

// 通过修改 UITextfield 的私有属性更改占位颜色和字体
- (void)createLoginTextField {
    UITextField *loginTextField = [[UITextField alloc] init];
    loginTextField.frame = CGRectMake(15,(self.view.bounds.size.height-52-50)/2, self.view.bounds.size.width-60-18,52);
    loginTextField.delegate = self;
    loginTextField.font = [UIFont systemFontOfSize:14];
    loginTextField.contentVerticalAlignment = UIControlContentVerticalAlignmentCenter;
    loginTextField.textColor = [UIColor blackColor];
    
    loginTextField.placeholder = @"用户名/邮箱";
    [loginTextField setValue:[UIFont systemFontOfSize:15] forKeyPath:@"_placeholderLabel.font"];
    [loginTextField setValue:[UIColor lightGrayColor]forKeyPath:@"_placeholderLabel.textColor"];
    
    [self.view addSubview:loginTextField];
}
```

---

## 3.2 万能控制器跳转

> 需求：
> 1. 某个页面的不同 banner 图，点击可以跳转到不同页面。
> 2. 推送通知，点击跳转到指定页面。
> 3. 二维码扫描，根据不同内容，跳转不同页面。
> 4. WebView 页面，根据 URL 点击不同，跳转不同的原生页面。

先来思考一下几种解决方法。

> 方法 1：在每个需要跳转的地方写一堆判断语句以及跳转语句。

> 方法 2：将判断语句和跳转语句抽取出来，写到基类，或者对应的 Category 中。

> 方法 3：利用 Runtime，定制一个万能跳转控制器工具。

实现步骤：
1. 事先和服务器端商量好，定义跳转不同控制器的规则，让服务器传回对应规则的相关参数。
比如：跳转到 A 控制器，需要服务器传回 A 控制器的类名，控制器 A 需要传入的属性参数（id、type 等等）。
2. 根据服务器传回的类名，创建对应的控制器对象；
3. 遍历服务器传回的参数，利用 Runtime 遍历控制器对象的属性列表；
4. 如果控制器对象存在该属性，则利用 KVC 进行赋值；
5. 进行跳转。


首先，定义跳转规则，如下所示。`XXViewController` 是将要跳转的控制器类名。`property` 字典中保存的是控制器所需的属性参数。

```Objc
// 定义的规则
NSDictionary *params = @{
                         @"class" : @"XXViewController",
                         @"property" : @{
                                 @"ID" : @"123",
                                 @"type" : @"XXViewController1"
                                 }
                         };
```

然后，添加一个工具类 `XXJumpControllerTool`，添加跳转相关的类方法。

```Objc
/********************* XXJumpControllerTool.h 文件 *********************/

#import <Foundation/Foundation.h>

@interface XXJumpControllerTool : NSObject

+ (void)pushViewControllerWithParams:(NSDictionary *)params;

@end


/********************* XXJumpControllerTool.m 文件 *********************/

#import "XXJumpControllerTool.h"
#import <UIKit/UIKit.h>
#import <objc/runtime.h>

@implementation XXJumpControllerTool

+ (void)pushViewControllerWithParams:(NSDictionary *)params {
    // 取出控制器类名
    NSString *classNameStr = [NSString stringWithFormat:@"%@", params[@"class"]];
    const char *className = [classNameStr cStringUsingEncoding:NSASCIIStringEncoding];
    
    // 根据字符串返回一个类
    Class newClass = objc_getClass(className);
    if (!newClass) {
        // 创建一个类
        Class superClass = [NSObject class];
        newClass = objc_allocateClassPair(superClass, className, 0);
        // 注册你创建的这个类
        objc_registerClassPair(newClass);
    }

    // 创建对象（就是控制器对象）
    id instance = [[newClass alloc] init];
    
    NSDictionary *propertys = params[@"property"];
    [propertys enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
        // 检测这个对象是否存在该属性
        if ([XXJumpControllerTool checkIsExistPropertyWithInstance:instance verifyPropertyName:key]) {
            // 利用 KVC 对控制器对象的属性赋值
            [instance setValue:obj forKey:key];
        }
    }];
    
    
    // 跳转到对应的控制器
    [[XXJumpControllerTool topViewController].navigationController pushViewController:instance animated:YES];
}


// 检测对象是否存在该属性
+ (BOOL)checkIsExistPropertyWithInstance:(id)instance verifyPropertyName:(NSString *)verifyPropertyName {
    unsigned int count, i;
    
    // 获取对象里的属性列表
    objc_property_t *properties = class_copyPropertyList([instance class], &count);
    
    for (i = 0; i < count; i++) {
        objc_property_t property =properties[i];
        //  属性名转成字符串
        NSString *propertyName = [[NSString alloc] initWithCString:property_getName(property) encoding:NSUTF8StringEncoding];
        // 判断该属性是否存在
        if ([propertyName isEqualToString:verifyPropertyName]) {
            free(properties);
            return YES;
        }
    }
    free(properties);
    
    return NO;
}

// 获取当前显示在屏幕最顶层的 ViewController
+ (UIViewController *)topViewController {
    UIViewController *resultVC = [XXJumpControllerTool _topViewController:[[UIApplication sharedApplication].keyWindow rootViewController]];
    while (resultVC.presentedViewController) {
        resultVC = [XXJumpControllerTool _topViewController:resultVC.presentedViewController];
    }
    return resultVC;
}

+ (UIViewController *)_topViewController:(UIViewController *)vc {
    if ([vc isKindOfClass:[UINavigationController class]]) {
        return [XXJumpControllerTool _topViewController:[(UINavigationController *)vc topViewController]];
    } else if ([vc isKindOfClass:[UITabBarController class]]) {
        return [XXJumpControllerTool _topViewController:[(UITabBarController *)vc selectedViewController]];
    } else {
        return vc;
    }
    return nil;
}

@end
```

测试代码：
```Objc
- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    // 万能跳转控制器
    [self jumpController];
}
```

---


## 3.3 实现字典转模型

在日常开发中，将网络请求中获取的 JSON 数据转为数据模型，是我们开发中必不可少的操作。通常我们会选用诸如 `YYModel`、`JSONModel` 或者 `MJExtension` 等第三方框架来实现这一过程。这些框架实现原理的核心就是 `Runtime` 和  `KVC`，以及 `Getter / Setter`。

实现的大体思路如下：借助 `Runtime` 可以动态获取成员列表的特性，遍历模型中所有属性，然后以获取到的属性名为 `key`，在 `JSON` 字典中寻找对应的值 `value`；再使用 `KVC` 或直接调用 `Getter / Setter` 将每一个对应 `value` 赋值给模型，就完成了字典转模型的目的。

> 需求：将服务器返回的 JSON 字典转为数据模型。

先准备一份待解析的 JSON 数据，内容如下：
```JSON
{
    "id": "123412341234",
    "name": "行走少年郎",
    "age": "18",
    "weight": 120,
    "address": {
        "country": "中国",
        "province": "北京"
    },
    "courses": [
        {
            "name": "Chinese",
            "desc": "语文课"
        },
        {
            "name": "Math",
            "desc": "数学课"
        },
        {
            "name": "English",
            "desc": "英语课"
        }
    ]
}
```

假设这就是服务器返回的 JSON 数据，内容是一个学生的信息。现在我们需要将该 JSON 字典转为方便开发的数据模型。

从这份 JSON 中可以看出，字典中取值除了字符串之外，还有数组和字典。那么在将字典转换成数据模型的时候，就要考虑 **模型嵌套模型**、**模型嵌套模型数组** 的情况了。具体步骤如下：

### 3.3.1 创建模型

经过分析，我们总共需要三个模型： XXStudentModel、XXAdressModel、XXCourseModel。

```Objc
/********************* XXStudentModel.h 文件 *********************/
#import <Foundation/Foundation.h>
#import "NSObject+XXModel.h"
@class XXAdressModel, XXCourseModel;

@interface XXStudentModel : NSObject <XXModel>

/* 姓名 */
@property (nonatomic, copy) NSString *name;
/* 学生号 id */
@property (nonatomic, copy) NSString *uid;
/* 年龄 */
@property (nonatomic, assign) NSInteger age;
/* 体重 */
@property (nonatomic, assign) NSInteger weight;
/* 地址（嵌套模型） */
@property (nonatomic, strong) XXAdressModel *address;
/* 课程（嵌套模型数组） */
@property (nonatomic, strong) NSArray *courses;

@end

/********************* XXStudentModel.m 文件 *********************/
#import "XXStudentModel.h"
#import "XXCourseModel.h"

@implementation XXStudentModel

+ (NSDictionary *)modelContainerPropertyGenericClass {
    //需要特别处理的属性
    return @{
             @"courses" : [XXCourseModel class],
             @"uid" : @"id"
             };
}

@end


/********************* XXAdressModel.h 文件 *********************/
#import <Foundation/Foundation.h>

@interface XXAdressModel : NSObject

/* 国籍 */
@property (nonatomic, copy) NSString *country;
/* 省份 */
@property (nonatomic, copy) NSString *province;
/* 城市 */
@property (nonatomic, copy) NSString *city;

@end


/********************* XXAdressModel.m 文件 *********************/
#import "XXAdressModel.h"

@implementation XXAdressModel

@end


/********************* XXCourseModel.h 文件 *********************/
#import <Foundation/Foundation.h>

@interface XXCourseModel : NSObject

/* 课程名 */
@property (nonatomic, copy) NSString *name;
/* 课程介绍 */
@property (nonatomic, copy) NSString *desc;

@end

/********************* XXCourseModel.m 文件 *********************/
#import "XXCourseModel.h"

@implementation XXCourseModel

@end
```

### 3.3.2 在 NSObject 分类中实现字典转模型
细心的你可能已经发现：上面的 `XXStudentModel.h` 文件中导入了 `#import "NSObject+XXModel.h"` 文件，并且遵循了 `<XXModel>` 协议，并且在 `XXStudentModel.m` 文件中实现了协议的 `+ (NSDictionary *)modelContainerPropertyGenericClass` 方法。

`NSObject+XXModel.h`、`NSObject+XXModel.m`  就是我们用来解决字典转模型所创建的分类，协议中的 `+ (NSDictionary *)modelContainerPropertyGenericClass` 方法用来告诉分类特殊字段的处理规则，比如 `id --> uid`。

```Objc
/********************* NSObject+XXModel.h 文件 *********************/
#import <Foundation/Foundation.h>

// XXModel 协议
@protocol XXModel <NSObject>

@optional
// 协议方法：返回一个字典，表明特殊字段的处理规则
+ (nullable NSDictionary<NSString *, id> *)modelContainerPropertyGenericClass;

@end;

@interface NSObject (XXModel)

// 字典转模型方法
+ (instancetype)xx_modelWithDictionary:(NSDictionary *)dictionary;

@end
```

```Objc
/********************* NSObject+XXModel.m 文件 *********************/
#import "NSObject+XXModel.h"
#import <objc/runtime.h>

@implementation NSObject (XXModel)

+ (instancetype)xx_modelWithDictionary:(NSDictionary *)dictionary {
    
    // 创建当前模型对象
    id object = [[self alloc] init];
    
    unsigned int count;
    
    // 获取当前对象的属性列表
    objc_property_t *propertyList = class_copyPropertyList([self class], &count);
    
    // 遍历 propertyList 中所有属性，以其属性名为 key，在字典中查找 value
    for (unsigned int i = 0; i < count; i++) {
        // 获取属性
        objc_property_t property = propertyList[i];
        const char *propertyName = property_getName(property);
        
        NSString *propertyNameStr = [NSString stringWithUTF8String:propertyName];
        
        // 获取 JSON 中属性值 value
        id value = [dictionary objectForKey:propertyNameStr];
        
        // 获取属性所属类名
        NSString *propertyType;
        unsigned int attrCount;
        objc_property_attribute_t *attrs = property_copyAttributeList(property, &attrCount);
        for (unsigned int i = 0; i < attrCount; i++) {
            switch (attrs[i].name[0]) {
                case 'T': { // Type encoding
                    if (attrs[i].value) {
                        propertyType = [NSString stringWithUTF8String:attrs[i].value];
                        // 去除转义字符：@\"NSString\" -> @"NSString"
                        propertyType = [propertyType stringByReplacingOccurrencesOfString:@"\"" withString:@""];
                        // 去除 @ 符号
                        propertyType = [propertyType stringByReplacingOccurrencesOfString:@"@" withString:@""];
                        
                    }
                } break;
                default: break;
            }
        }
        
        // 对特殊属性进行处理
        // 判断当前类是否实现了协议方法，获取协议方法中规定的特殊属性的处理方式
        NSDictionary *perpertyTypeDic;
        if([self respondsToSelector:@selector(modelContainerPropertyGenericClass)]){
            perpertyTypeDic = [self performSelector:@selector(modelContainerPropertyGenericClass) withObject:nil];
        }
        
        // 处理：字典的 key 与模型属性不匹配的问题，如 id -> uid
        id anotherName = perpertyTypeDic[propertyNameStr];
        if(anotherName && [anotherName isKindOfClass:[NSString class]]){
            value =  dictionary[anotherName];
        }

        // 处理：模型嵌套模型的情况
        if ([value isKindOfClass:[NSDictionary class]] && ![propertyType hasPrefix:@"NS"]) {
            Class modelClass = NSClassFromString(propertyType);
            if (modelClass != nil) {
                // 将被嵌套字典数据也转化成Model
                value = [modelClass xx_modelWithDictionary:value];
            }
        }

        // 处理：模型嵌套模型数组的情况
        // 判断当前 value 是一个数组，而且存在协议方法返回了 perpertyTypeDic
        if ([value isKindOfClass:[NSArray class]] && perpertyTypeDic) {
            Class itemModelClass = perpertyTypeDic[propertyNameStr];
            //封装数组：将每一个子数据转化为 Model
            NSMutableArray *itemArray = @[].mutableCopy;
            for (NSDictionary *itemDic  in value) {
                id model = [itemModelClass xx_modelWithDictionary:itemDic];
                [itemArray addObject:model];
            }
            value = itemArray;
        }

        // 使用 KVC 方法将 value 更新到 object 中
        if (value != nil) {
            [object setValue:value forKey:propertyNameStr];
        }
        
    }
    free(propertyList);
    
    return object;
}

@end
```

### 3.3.3 测试代码

```Ojbc
- (void)parseJSON {
    
    NSString *filePath = [[NSBundle mainBundle] pathForResource:@"Student" ofType:@"json"];
    NSData *jsonData = [NSData dataWithContentsOfFile:filePath];

    // 读取 JSON 数据
    NSDictionary *json = [NSJSONSerialization JSONObjectWithData:jsonData options:NSJSONReadingMutableContainers error:nil];
    NSLog(@"%@",json);

    // JSON 字典转模型
    XXStudentModel *student = [XXStudentModel xx_modelWithDictionary:json];

    NSLog(@"student.uid = %@", student.uid);
    NSLog(@"student.name = %@", student.name);

    for (unsigned int i = 0; i < student.courses.count; i++) {
        XXCourseModel *courseModel = student.courses[i];
        NSLog(@"courseModel[%d].name = %@ .desc = %@", i, courseModel.name, courseModel.desc);
    }
}
```

效果如下：

![](http://qcdn.itcharge.cn/images/iOS-Runtime-04-002.png)



当然，如若需要考虑缓存机制、性能问题、对象类型检查等，建议还是使用例如 `YYModel` 之类的知名第三方框架，或者自己造轮子。

---

## 3.4 改进 iOS 归档和解档

「归档」是一种常用的轻量型文件存储方式，在项目中，如果需要将数据模型本地化存储，一般就会用到归档和解档。但是如果数据模型中有多个属性的话，我们不得不对每个属性进行处理，这个过程非常繁琐。

这里我们可以参考之前「字典转模型」 的代码。通过 Runtime 获取类的属性列表，实现自动归档和解档。归档操作和解档操作主要会用到了两个方法： `encodeObject: forKey:` 和 `decodeObjectForKey:`。

首先在 NSObject 的分类 `NSObject+XXModel.h`、`NSObject+XXModel.m` 中添加以下代码：

```Objc
// 解档
- (instancetype)xx_modelInitWithCoder:(NSCoder *)aDecoder {
    if (!aDecoder) return self;
    if (!self) {
        return self;
    }
    
    unsigned int count;
    objc_property_t *propertyList = class_copyPropertyList([self class], &count);
    for (unsigned int i = 0; i < count; i++) {
        const char *propertyName = property_getName(propertyList[i]);
        NSString *name = [NSString stringWithUTF8String:propertyName];
        
        id value = [aDecoder decodeObjectForKey:name];
        [self setValue:value forKey:name];
    }
    free(propertyList);
    
    return self;
}

// 归档
- (void)xx_modelEncodeWithCoder:(NSCoder *)aCoder {
    if (!aCoder) return;
    if (!self) {
        return;
    }
    unsigned int count;
    objc_property_t *propertyList = class_copyPropertyList([self class], &count);
    for (unsigned int i = 0; i < count; i++) {
        const char *propertyName = property_getName(propertyList[i]);
        NSString *name = [NSString stringWithUTF8String:propertyName];
        
        id value = [self valueForKey:name];
        [aCoder encodeObject:value forKey:name];
    }
    free(propertyList);
}
```

然后在需要实现归档解档的模型中，添加 `-initWithCoder:` 和 `-encodeWithCoder:` 方法。

```Objc
#import "XXPerson.h"
#import "NSObject+XXModel.h"

@implementation XXPerson

- (instancetype)initWithCoder:(NSCoder *)aDecoder {
    self = [super init];
    if (self) {
        [self xx_modelInitWithCoder:aDecoder];
    }
    return self;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
    [self xx_modelEncodeWithCoder:aCoder];
}

@end
```

测试一下归档解档代码：

```Objc
XXPerson *person = [[XXPerson alloc] init];
person.uid = @"123412341234";
person.name = @"行走少年郎";
person.age = 18;
person.weight = 120;

// 归档
NSString *path = [NSString stringWithFormat:@"%@/person.plist", NSHomeDirectory()];
[NSKeyedArchiver archiveRootObject:person toFile:path];

// 解档
XXPerson *personObject = [NSKeyedUnarchiver unarchiveObjectWithFile:path];

NSLog(@"personObject.uid = %@", personObject.uid);
NSLog(@"personObject.name = %@", personObject.name);
```

当然，上边代码只是演示一下 Runtime 对于归档和解档的优化，真正用在开发中的逻辑远比上边的样例要负责，具体也参考 `YYModel` 的实现。

---

# 参考资料
- [CoyoteK : runtime从入门到精通（九）—— 万能界面跳转](https://blog.csdn.net/coyote1994/article/details/52472670)
- [梧雨北辰 : Runtime-iOS运行时应用篇](https://www.jianshu.com/p/fe131f8757ba)
- [雷曼同学 : https://www.jianshu.com/p/361c9136cf3a](https://www.jianshu.com/p/361c9136cf3a)
- [ibireme : iOS JSON 模型转换库评测](https://blog.ibireme.com/2015/10/23/ios_model_framework_benchmark/)

