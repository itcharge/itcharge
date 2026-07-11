---
title: Docker、Kubernetes、KubeSphere 简易使用文档
categories:
  - 技术
  - 服务器端
tags:
  - 技术
  - 服务器
createTime: 2024/04/14 00:00:00
permalink: /blogs/tech/server/docker-k8s-commands/
comments: true
---

Docker、Kubernetes 与 KubeSphere 常用命令速查，按镜像、容器、服务管理等维度整理日常运维所需指令。

<!-- more -->

# 1. Docker 相关命令

## 1.1 Docker 服务相关命令

1. 启动 Docker 服务


​ 
​ 
 systemctl start docker

2. 停止 Docker 服务


​ 
​ 
 systemctl stop docker

3. 重启 Docker 服务


​ 
​ 
 systemctl restart docker

4. 设置开机启动 Docker 服务


​ 
​ 
 systemctl enable docker

5. 查看 Docker 服务状态


​ 
​ 
 systemctl status docker

## 1.2 镜像相关命令

1. 查看本地的镜像信息


​ 
​ 
 docker images

2. 从镜像仓库中拉取或者更新指定镜像（默认的镜像仓库是官方的 Docker Hub）


​ 
​ 
 docker pull NAME[:TAG]

3. 从镜像仓库查找镜像


​ 
​ 
 docker search NAME

4. 根据本地 Dockerfile 文件，构建镜像


​ 
​ 
 # docker build -t 镜像名:版本号 . 注意最后边的点 . 表示当前目录
 docker build -t my_image:1.0 .

5. 删除本地镜像


​ 
​ 
 # docker rmi 镜像明:版本号
 docker rmi mysql:5.7

6. 导入镜像


​ 
​ 
 # docker load -i 指定要导入的镜像压缩包文件名
 docker load -i image.tar

7. 导出镜像


​ 
​ 
 # docker save -o 导出的镜像压缩包的文件名 要导出的镜像名:版本号
 docker save -o image.tar target_image:tag

## 1.3 容器相关命令

1. 创建容器


​ 
​ 
 docker run -d --name=my_container -p 8080:8080 tomcat:latest
 
 # 常用参数列表
 # -d: 后台运行容器，并返回容器 ID；
 # -p: 指定端口映射，格式为：主机(宿主)端口:容器端口；
 # -i: 以交互模式运行容器，通常与 -t 同时使用；
 # -t: 为容器重新分配一个伪输入终端，通常与 -i 同时使用；
 # --name=my_container: 为容器指定一个名称；
 # --dns 8.8.8.8: 指定容器使用的 DNS 服务器，默认和宿主一致；

2. 查看容器列表


​ 
​ 
 # 查看正在运行的容器列表
 docker ps
 
 # 查看最近一次创建的容器
 docker ps -l
 
 # 查看正在运行的容器 ID 列表
 docker ps -q
 
 # 查看全部容器(包括已经停止的容器)
 docker ps -a
 
 # 查看全部容器 ID 列表
 docker ps -aq

3. 停止运行的容器


​ 
​ 
 # 使用容器名停止
 docker stop my_container
 
 # 使用容器 ID 停止
 docker stop container_id
 
 # 使用容器 ID 停止多个正在运行的容器
 ps

4. 启动已停止的容器


​ 
​ 
 # 容器名
 docker start my_container
 
 # 容器 ID
 docker start container_id
 
 # 使用容器 ID 启动多个已停止的容器
 docker start `docker ps -aq`

5. 删除容器


​ 
​ 
 # 用容器名删除
 docker rm my_container
 
 # 用容器 ID 删除
 docker rm container_id
 
 # 删除多个未运行的容器, 运行中的无法删除
 docker rm `docker ps -aq`

6. 进入容器（正在运行的容器才可以进入）


​ 
​ 
 # 使用容器名
 docker exec -it my_container /bin/bash
 
 # 使用容器 ID
 docker exec -it container_id /bin/bash

7. 查看容器信息


​ 
​ 
 # 容器名
 docker inspect my_container
 
 # 容器 ID
 docker inspect container_id

# 2. kubernetes 相关命令

1. 获取资源信息


​ 
​ 
 # 查看所有的资源信息
 kubectl get all
 # 查看 pod 列表
 kubectl get pod
 # 显示 pod 节点的标签信息
 kubectl get pod --show-labels
 # 根据指定标签匹配到具体的 pod
 kubectl get pods -l app=example
 # 查看 node 节点列表
 kubectl get node 
 # 显示 node 节点的标签信息
 kubectl get node --show-labels
 # 查看 pod 详细信息，也就是可以查看 pod 具体运行在哪个节点上（ip 地址信息）
 kubectl get pod -o wide
 # 查看服务的详细信息，显示了服务名称，类型，集群 ip，端口，时间等信息
 kubectl get svc
 [root@master ~]# kubectl get svc
 NAME TYPE CLUSTER-IP EXTERNAL-IP PORT(S) AGE
 go-service NodePort 10.10.10.247 &lt;none&gt; 8089:33702/TCP 29m
 java-service NodePort 10.10.10.248 &lt;none&gt; 8082:32823/TCP 5h17m
 kubernetes ClusterIP 10.10.10.1 &lt;none&gt; 443/TCP 5d16h
 nginx-service NodePort 10.10.10.146 &lt;none&gt; 88:34823/TCP 2d19h
 # 查看命名空间
 kubectl get ns
 # 查看所有 pod 所属的命名空间
 kubectl get pod --all-namespaces
 # 查看所有 pod 所属的命名空间并且查看都在哪些节点上运行
 kubectl get pod --all-namespaces -o wide
 # 查看目前所有的 replica set，显示了所有的 pod 的副本数，以及他们的可用数量以及状态等信息
 kubectl get rs
 [root@master ~]# kubectl get rs
 NAME DESIRED CURRENT READY AGE
 go-deployment-58c76f7d5c 1 1 1 32m
 java-deployment-76889f56c5 1 1 1 5h21m
 nginx-deployment-58d6d6ccb8 3 3 3 2d19h
 # 查看目前所有的 deployment
 kubectl get deployment
 [root@master ~]# kubectl get deployment
 NAME READY UP-TO-DATE AVAILABLE AGE
 go-deployment 1/1 1 1 34m
 java-deployment 1/1 1 1 5h23m
 nginx-deployment 3/3 3 3 2d19h
 # 查看已经部署了的所有应用，可以看到容器，以及容器所用的镜像，标签等信息
 kubectl get deploy -o wide
 [root@master bin]# kubectl get deploy -o wide 
 NAME READY UP-TO-DATE AVAILABLE AGE CONTAINERS IMAGES SELECTOR
 nginx 3/3 3 3 16m nginx nginx:1.10 app=example

2. 根据配置文件创建资源


​ 
​ 
 # 根据配置文件，创建 Deployment 和 Service 资源
 kubectl create -f javak8s-deployment.yaml
 kubectl create -f javak8s-service.yaml

3. 根据配置文件启动资源


​ 
​ 
 kubectl apply -f javak8s-deployment.yaml
 kubectl apply -f javak8s-service.yaml

4. Pod 文件简单模板


​ 
​ 
 # javak8s-deployment.yaml
 apiVersion: v1
 kind: Pod # 创建的资源类型 pod
 metadata:
 name: ember-app # 资源名称
 labels:
 app: ember-app # pod 标签 用在 service 中进行筛选 
 spec: 
 containers:
- image: zhyq0826/nginx:k8s-ember-app # 镜像名称 来自 docker hub 公开镜像 / 本地镜像 
 name: ember-app # pod container 的名称 
 ports:
- containerPort: 80 # 容器监控 port

5. 删除资源


​ 
​ 
 # 根据 yaml 文件删除对应的资源，但是 yaml 文件并不会被删除，这样更加高效
 kubectl delete -f javak8s-deployment.yaml 
 kubectl delete -f javak8s-service.yaml
 # 也可以通过具体的资源名称来进行删除，使用这个删除资源，需要同时删除 pod 和 service 资源才行
 kubectl delete 具体的资源名称

6. 在集群中分创建并运行一个或多个容器镜像


​ 
​ 
 # 基本语法
 run NAME --image=image [--env="key=value"] [--port=port] [--replicas=replicas] [--dry-run=bool] [--overrides=inline-json] [--command] -- [COMMAND] [args...]
 # 示例，运行一个名称为 nginx，副本数为 3，标签为 app=example，镜像为 nginx:1.10，端口为 80 的容器实例
 kubectl run nginx --replicas=3 --labels="app=example" --image=nginx:1.10 --port=80

# 3. KubeSphere 简单使用

KubeSphere 上最常用的就是「工作负载的部署」。也就是 「Docker 容器的部署」，具体步骤如下：

## 3.1 步骤 1：打开仪表板

打开 KubeSphere Web 管理页面，转到项目的「应用负载」，选择「工作负载」，点击右侧「部署」选项卡下面的「创建」按钮。

[](https://qcdn.itcharge.cn/images/20240415112723.png)

## 3.2 步骤 2：输入基本信息

为该部署指定一个名称（例如 `demo-deployment`），选择一个项目（默认选 `default`），点击「下一步」继续。

[](https://qcdn.itcharge.cn/images/20240415112733.png)

## 3.3 步骤 3：设置容器组

有两种方式，第一种是根据 YAML 配置文件设置容器。

第一种方式：启用右上角的「编辑 YAML」，查看 YAML 格式的部署清单文件。可以直接编辑清单文件进行创建部署，这一步跟 kubernetes 相关命令中的「根据配置文件创建资源」差不多。

第二种方式：

1. 设置镜像前，请点击「容器组副本数量」中的 [icon](https://kubesphere.io/images/docs/v3.x/zh-cn/project-user-guide/application-workloads/deployments/plus-icon.png) 或 [icon](https://kubesphere.io/images/docs/v3.x/zh-cn/project-user-guide/application-workloads/deployments/minus-icon.png) 来定义容器组的副本数量，该参数显示在清单文件中的 `.spec.replicas` 字段。
2. 点击「添加容器」。
3. 输入镜像名称，该镜像可以来自公共 Docker Hub，也可以来自您指定的「私有仓库」。例如，在搜索栏输入 `nginx` 然后按「回车键」。 
   - 如果想使用私有镜像仓库，应该先通过「配置」下面的「保密字典」，参考：[创建镜像仓库保密字典](https://kubesphere.io/zh/docs/v3.3/project-user-guide/configuration/image-registry/)。
4. 根据需求设置 CPU 和内存的资源请求和限制。
5. 点击「使用默认端口」以自动填充「端口设置」，或者自定义「协议」、「名称」和「容器端口」。
6. 在下拉列表中选择镜像拉取策略。有关更多信息，参考：[容器镜像设置中关于镜像拉取策略的内容](https://kubesphere.io/zh/docs/v3.3/project-user-guide/application-workloads/container-image-settings/#添加容器镜像)。
7. 对于其他设置（「健康检查」、「启动命令」、「环境变量」、「容器安全上下文」以及「同步主机时区」），也可以在仪表板上配置。参考：[容器组设置](https://kubesphere.io/zh/docs/v3.3/project-user-guide/application-workloads/container-image-settings/#添加容器镜像) 中对这些属性的详细说明。操作完成后，点击右下角的 ✓ 继续。
8. 在下拉菜单中选择更新策略。建议您选择「滚动更新」。参考：[更新策略](https://kubesphere.io/zh/docs/v3.3/project-user-guide/application-workloads/container-image-settings/#更新策略)。
9. 选择容器组调度规则。有关更多信息，参考：[容器组调度规则](https://kubesphere.io/zh/docs/v3.3/project-user-guide/application-workloads/container-image-settings/#容器组调度规则)。
10. 完成容器组设置后，点击「下一步」继续。



[](https://qcdn.itcharge.cn/images/20240415112751.png)

[](https://qcdn.itcharge.cn/images/20240415112805.png)

## 3.4 步骤 4：挂载持久卷

1. 直接添加持久卷或者挂载配置字典或保密字典，或者直接点击「下一步」跳过该步骤。参考：[持久卷声明](https://kubesphere.io/zh/docs/v3.3/project-user-guide/storage/volumes/#挂载持久卷声明)。



[](https://qcdn.itcharge.cn/images/20240415112817.png)

## 3.5 步骤 5：配置高级设置

可以在该部分设置节点调度策略并添加元数据。完成操作后，点击「创建」完成创建部署的整个流程。

1. **选择节点** ：分配容器组副本在指定节点上运行。该参数在 `nodeSelector` 字段中指定。
2. **添加元数据** ：为资源进行额外的元数据设置，例如「标签」和「注解」。



[](https://qcdn.itcharge.cn/images/20240415112830.png)

## 3.6 步骤 6：查看部署详情

1. 部署创建后会显示在列表中。您可以点击右边的 [icon](https://kubesphere.io/images/docs/v3.x/zh-cn/project-user-guide/application-workloads/deployments/three-dots.png)，在弹出菜单中选择操作，修改您的部署。 
   - **编辑信息** ：查看并编辑基本信息。
  * **编辑 YAML** ：查看、上传、下载或者更新 YAML 文件。
  * **重新创建** ：重新创建该部署。
  * **删除** ：删除该部署。
2. 点击部署名称可以进入它的详情页面。
3. 点击「更多操作」，显示您可以对该部署进行的操作。 
  * **回退** ：选择要回退的版本。
  * **编辑自动扩缩** ：根据 CPU 和内存使用情况自动伸缩副本。如果 CPU 和内存都已指定，则在满足任一条件时会添加或删除副本。
  * **编辑设置** ：配置更新策略、容器和存储。
  * **编辑 YAML** ：查看、上传、下载或者更新 YAML 文件。
  * **重新创建** ：重新创建该部署。
  * **删除** ：删除该部署并返回部署列表页面。
4. 点击「资源状态」选项卡，查看该部署的端口和容器组信息。 
  * **副本运行状态** ：点击 [icon](https://kubesphere.io/images/docs/v3.x/common-icons/replica-plus-icon.png) 或 [icon](https://kubesphere.io/images/docs/v3.x/common-icons/replica-minus-icon.png) 来增加或减少容器组副本数量。
  * **容器组** ： 
  * 容器组列表中显示了容器组详情（运行状态、节点、容器组 IP 以及资源使用情况）。
  * 您可以点击容器组条目查看容器信息。
  * 点击容器日志图标查看容器的输出日志。
  * 您可以点击容器组名称查看容器组详情页面。



[](https://qcdn.itcharge.cn/images/20240415112842.png)

## 参考资料

1. [k8s 的一些基本命令 - 51CTO 博客](https://blog.51cto.com/u_14479502/3117041)
2. [超详细的 Docker 常用命令 - 掘金](https://juejin.cn/post/7245275769219203132)
3. [kubesphere - 部署](https://kubesphere.io/zh/docs/v3.3/project-user-guide/application-workloads/deployments/)
