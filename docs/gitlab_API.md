# gitlab_API

![](http://images2015.cnblogs.com/blog/282019/201510/282019-20151020103628145-762219576.jpg)

gitlab提供了各种语言的API,但是唯独没有`js`的，不知为何。只好自己写一套。


**1. 查询所有的repos**
###### 接口功能
> 查询所有的repos

###### URL
> [https://gitlab.com/api/v3/projects](https://gitlab.com/api/v3/projects)

###### HTTP请求方式
> GET

###### 请求参数
> |参数|必选|类型|说明|
|:-----|:-------|:-----|----- |
|private_token|ture|string| token |

###### 返回字段
> |返回字段|字段类型|说明|
|:-----    |:------|:-----------------------------|
|id|int    |当前projec的id|
|owner|object| owner|
|namespace|object |空间|

###### 接口示例
> 地址：[https://gitlab.com/api/v3/projects?private_token=Ec62sMY45Kezs7HWjxzW](https://gitlab.com/api/v3/projects?private_token=Ec62sMY45Kezs7HWjxzW)


**2. List repository tree**
###### 接口功能
> 查询项目目录结构

###### URL
> [https://gitlab.com/api/v3/projects/:id/repository/tree](https://gitlab.com/api/v3/projects/:id/repository/tree)

###### HTTP请求方式
> GET

###### 请求参数
> |参数|必选|类型|说明|
|:-----     |:-------|:-----|-----                               |
|id |ture    |string| 项目id|
|path      |false   |string |The path inside repository. Used to get contend of subdirectories|
|ref_name |false|string|The name of a repository branch or tag or if not given the default branch

###### 返回字段
> |返回字段|字段类型|说明                              |
|:-----   |:------|:-----------------------------   |
|status   |int    |返回结果状态。0：正常；1：错误。   |
|company  |string | 所属公司名                      |
|category |string |所属类型                         |

###### 接口示例
> 地址：[https://gitlab.com/api/v3/?private_token=Ec62sMY45Kezs7HWjxzW&id=655&path=src&ref_name=master](https://gitlab.com/api/v3/?private_token=Ec62sMY45Kezs7HWjxzW&id=613&path=src&ref_name=master)


**3. get file content with pjax**
###### 接口示例
> 地址：[https://gitlab.com/FrankFan/todos/blob/master/release.sh?_pjax=%23tree-content-holder](https://gitlab.com/FrankFan/todos/blob/master/release.sh?_pjax=%23tree-content-holder)

> there was some potential bugs here.


### 参考：
  [1]: http://doc.gitlab.com/ce/api/repositories.html

  [2]: http://gitlab.lujs.cn/api/v3/projects/

  [3]: http://doc.gitlab.com/ce/api/repository_files.html

  [4]: https://gitlab.com/gitlab-org/gitlab-ce/tree/master#README

  [5]: http://gxxsite.com/content/view/id/150.html
  
  [6]: http://www.ueffort.com/pjax-ji-shu/