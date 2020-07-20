---
title: iOS 网络：HTTP 请求
date: 2016-05-13 19:27:37
tags:
    - 技术
    - iOS 开发
categories:
    - 00 - 技术 - iOS 开发
---

> 本文用来对 iOS 网络中 HTTP 请求相关内容进行总结。



<!--more-->

# HTTP 请求

- ## 1.NSURLConnectiong

    - ### 1.同步GET请求

    ```objc
    // 1.创建请求路径(url)
    NSURL *url = [NSURL URLWithString:@""];

    // 2.通过请求路径(url)创建请求对象(request)
    NSURLRequest *request = [NSURLRequest requestWithURL:url];

    // 3.向服务器发送同步请求(data)
    NSData *data = [NSURLConnection sendSynchronousRequest:request returningResponse:nil error:nil];
    // sendSynchronousRequest阻塞式的方法，等待服务器返回数据

    // 4.解析服务器返回的数据(解析成字符串)
    NSString *string = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    ```

    - ### 2.异步GET请求

    ```objc
    // 1.创建请求路径(url)
    NSURL *url = [NSURL URLWithString:@""];

    // 2.通过请求路径(url)创建请求对象(request)
    NSURLRequest *request = [NSURLRequest requestWithURL:url];

    // 3.向服务器发送异步请求
    [NSURLConnection sendAsynchronousRequest:request queue:[[NSOperationQueue alloc] init] completionHandler:^(NSURLResponse *response, NSData *data, NSError *connectionError) {
        // 请求完毕会来到这个block

        // 4.解析服务器返回的数据（解析成字符串）
        NSString *string = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        NSLog(@"%@", string);
    }];

    ```

    - ### 3.通过代理发送异步请求

    ```objc
    // 1.创建请求路径(url)
    NSURL *url = [NSURL URLWithString:@""];

    // 2.通过请求路径(url)创建请求对象(request)
    NSURLRequest *request = [NSURLRequest requestWithURL:url];

    // 3.通过代理创建连接对象
    [NSURLConnection connectionWithRequest:request delegate:self];

    // [[NSURLConnection alloc] initWithRequest:request delegate:self];

    // NSURLConnection *conn = [[NSURLConnection alloc] initWithRequest:request delegate:self startImmediately:NO];
    // startImmediately:是否立即发送请求

    // 开始发送请求
    // [conn start];

    // 取消发送请求
    // [conn cancel];
    ```

    代理需要实现的方法：
    ```objc
    #pragma mark - <NSURLConnectionDataDelegate>
    
    // 接收到服务器的响应
    -(void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response;
    
    // 接收到服务器的数据（如果数据量比较大，这个方法会被调用多次）
    -(void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data; // 不断拼接服务器返回的数据
    
    // 服务器的数据成功接收完毕
    -(void)connectionDidFinishLoading:(NSURLConnection *)connection;
    
    // 请求失败（比如请求超时）
    -(void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error;
    ```

    - ### 4.同步POST请求

    ```objc
    // 1.创建请求路径(url)
    NSURL *url = [NSURL URLWithString:@""];
    
    // 2.通过请求路径(url)创建请求对象(request)
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    // 更改请求方法
    request.HTTPMethod = @"POST";
    // 设置请求体
    request.HTTPBody = [@"" dataUsingEncoding:NSUTF8StringEncoding];
    // 设置超时(5秒后超时)
    request.timeoutInterval = 5;
    // 设置请求头(非必要，看情况)
    //    [request setValue:@"iOS 9.0" forHTTPHeaderField:@"User-Agent"];
    
    // 3.向服务器发送同步请求
    [NSURLConnection sendSynchronousRequest:request returningResponse:nil error:nil];
    
    ```

    - ### 5.异步POST请求

    ```objc
    // 1.创建请求路径(url)
    NSURL *url = [NSURL URLWithString:@""];

    // 2.通过请求路径(url)创建请求对象(request)
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    // 更改请求方法
    request.HTTPMethod = @"POST";
    // 设置请求体
    request.HTTPBody = [@"" dataUsingEncoding:NSUTF8StringEncoding];
    // 设置超时(5秒后超时)
    request.timeoutInterval = 5;
    // 设置请求头
    // [request setValue:@"iOS 9.0" forHTTPHeaderField:@"User-Agent"];

    // 3.向服务器发送异步请求
    [NSURLConnection sendAsynchronousRequest:request queue:[NSOperationQueue mainQueue] completionHandler:^(NSURLResponse *response, NSData *data, NSError *connectionError) {
        if (connectionError) { // 比如请求超时
            NSLog(@"----请求失败");
        } else {
            NSLog(@"------%@", [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
        }
    }];

    ```

    - ### 6.NSURLConnection 中文URL处理

    ```objc
    NSString *urlStr = @"";
    // 将中文URL进行转码
    urlStr = [urlStr stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
    NSURL *url = [NSURL URLWithString:urlStr];
    ```

- ## 2.NSURLSession
    - ### GET请求

    ```objc
    // 第一种GET请求
    // 获得NSURLSession对象
    NSURLSession *session = [NSURLSession sharedSession];

    // 创建任务
    NSURLSessionDataTask *task = [session dataTaskWithRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:@""]] completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        NSLog(@"%@", [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:nil]);
    }];

    // 启动任务
    [task resume];
    ```

    ```objc
    // 第二种GET请求
    // 获得NSURLSession对象
    NSURLSession *session = [NSURLSession sharedSession];

    // 创建任务
    NSURLSessionDataTask *task = [session dataTaskWithURL:[NSURL URLWithString:@""] completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        NSLog(@"%@", [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:nil]);
    }];

    // 启动任务
    [task resume];
    ```

    - ### POST请求

    ```objc
    // 获得NSURLSession对象
    NSURLSession *session = [NSURLSession sharedSession];

    // 创建请求
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:@""]];
    request.HTTPMethod = @"POST"; // 请求方法
    request.HTTPBody = [@"" dataUsingEncoding:NSUTF8StringEncoding]; // 请求体

    // 创建任务
    NSURLSessionDataTask *task = [session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        NSLog(@"%@", [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:nil]);
    }];

    // 启动任务
    [task resume];
    ```

    - ### 通过代理发送请求

    ```objc
    // 获得NSURLSession对象
    NSURLSession *session = [NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration] delegate:self delegateQueue:[[NSOperationQueue alloc] init]];

    // 创建任务
    NSURLSessionDataTask *task = [session dataTaskWithRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:@""]]];

    // 启动任务
    [task resume];
    ```

    代理需要实现的方法：

    ```objc
    #pragma mark - <NSURLSessionDataDelegate>
    
    // 1.接收到服务器的响应
    -(void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveResponse:(NSURLResponse *)response completionHandler:(void (^)(NSURLSessionResponseDisposition))completionHandler
    {
        // 允许处理服务器的响应，才会继续接收服务器返回的数据
        completionHandler(NSURLSessionResponseAllow);
        // void (^)(NSURLSessionResponseDisposition)
    }
    
    // 2.接收到服务器的数据（可能会被调用多次）
    -(void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data
    {
        NSLog(@"%s", __func__);
    }

    // 3.请求成功或者失败（如果失败，error有值）
    -(void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
    {
        NSLog(@"%s", __func__);
    }
    ```

- ## AFNetworking

    - GET请求

    ```objc
    // 第一种GET请求
    AFHTTPRequestOperationManager *mgr = [AFHTTPRequestOperationManager manager];

    NSDictionary *params = @{
                             @"" : @"",
                             @"" : @""
                             };

    [mgr GET:@"" parameters:params
     success:^(AFHTTPRequestOperation *operation, id responseObject) {
         NSLog(@"请求成功---%@", responseObject);
     } failure:^(AFHTTPRequestOperation *operation, NSError *error) {
         NSLog(@"请求失败---%@", error);
    }];
    ```

    ```objc
    // 第二种GET请求
    // AFHTTPSessionManager内部包装了NSURLSession
    AFHTTPSessionManager *mgr = [AFHTTPSessionManager manager];

    NSDictionary *params = @{
                             @"" : @"",
                             @"" : @""
                             };

    [mgr GET:@"" parameters:params success:^(NSURLSessionDataTask *task, id responseObject) {
        NSLog(@"请求成功---%@", responseObject);
    } failure:^(NSURLSessionDataTask *task, NSError *error) {
        NSLog(@"请求失败---%@", error);
    }];
    ```

    - POST请求

    ```objc
    // AFHTTPRequestOperationManager内部包装了NSURLConnection
    AFHTTPRequestOperationManager *mgr = [AFHTTPRequestOperationManager manager];

    NSDictionary *params = @{
                             @"" : @"",
                             @"" : @""
                             };

    [mgr POST:@"" parameters:params
     success:^(AFHTTPRequestOperation *operation, id responseObject) {
         NSLog(@"请求成功---%@", responseObject);
     } failure:^(AFHTTPRequestOperation *operation, NSError *error) {
         NSLog(@"请求失败---%@", error);
     }];

    ```
