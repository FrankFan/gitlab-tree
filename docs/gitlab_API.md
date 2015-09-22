# gitlab_API

  [1]: http://doc.gitlab.com/ce/api/repositories.html
  [2]: http://gitlab.lujs.cn/api/v3/projects/
  [3]: http://doc.gitlab.com/ce/api/repository_files.html
  [4]: https://gitlab.com/gitlab-org/gitlab-ce/tree/master#README

gitlab官方没有找到对应的javascript API，只好自己写一套了。

1. 获取 `private_token`

测试：
curl --header "PRIVATE-TOKEN: QVy1PB7sTxfy4pqfZM1U" "http://gitlab.lujs.cn/api/v3/projects/"


2.
GET /projects/:id/repository/files
GET /projects/613/repository/files

curl --header "PRIVATE-TOKEN: f5o7jas_rQYPCCLHxKVy" "http://gitlab.lujs.cn/api/v3/projects/613/repository/files?file_path=zip.sh&ref=master"

3.
/projects/:id/repository/tree
/projects/613/repository/tree
curl --header "PRIVATE-TOKEN: f5o7jas_rQYPCCLHxKVy" "http://gitlab.lujs.cn/api/v3/projects/613/repository/tree"

------


目录

1. 查询指定项目属性接口

***

**1. 查询所有的repos**
###### 接口功能
> 查询所有的repos

###### URL
> [https://gitlab.com/api/v3/projects](https://gitlab.com/api/v3/projects)

###### HTTP请求方式
> GET

###### 请求参数
> |参数|必选|类型|说明|
|:-----     |:-------|:-----|-----                               |
|private_token|ture    |string| token                          |
|type      |true    |int   |请求项目的类型。1：类型一；2：类型二 。|

###### 返回字段
> |返回字段|字段类型|说明                              |
|:-----    |:------|:-----------------------------   |
|id|int    |当前projec的id   |
|owner  |object| owner                      |
|namespace|object |空间                         |

###### 接口示例
> 地址：[https://gitlab.com/api/v3/projects?private_token=Ec62sMY45Kezs7HWjxzW](https://gitlab.com/api/v3/projects?private_token=Ec62sMY45Kezs7HWjxzW)
``` javascript
[
    {
        "id": 459619,
        "description": "a TODO app build with backbone.js, grunt yeaman and bower",
        "default_branch": "master",
        "tag_list": [],
        "public": true,
        "archived": false,
        "visibility_level": 20,
        "ssh_url_to_repo": "git@gitlab.com:FrankFan/backbone-todos.git",
        "http_url_to_repo": "https://gitlab.com/FrankFan/backbone-todos.git",
        "web_url": "https://gitlab.com/FrankFan/backbone-todos",
        "owner": {
            "name": "FrankFan",
            "username": "FrankFan",
            "id": 244947,
            "state": "active",
            "avatar_url": "https://secure.gravatar.com/avatar/347f3740e6de7b32c185a9bb130b312e?s=40&d=identicon",
            "web_url": "https://gitlab.com/u/FrankFan"
        },
        "name": "backbone-todos",
        "name_with_namespace": "FrankFan / backbone-todos",
        "path": "backbone-todos",
        "path_with_namespace": "FrankFan/backbone-todos",
        "issues_enabled": true,
        "merge_requests_enabled": true,
        "wiki_enabled": true,
        "snippets_enabled": false,
        "created_at": "2015-09-11T18:19:03.834Z",
        "last_activity_at": "2015-09-11T18:19:03.834Z",
        "creator_id": 244947,
        "namespace": {
            "id": 287937,
            "name": "FrankFan",
            "path": "FrankFan",
            "owner_id": 244947,
            "created_at": "2015-09-11T17:44:54.602Z",
            "updated_at": "2015-09-11T17:44:54.602Z",
            "description": "",
            "avatar": null,
            "membership_lock": false
        },
        "avatar_url": null,
        "star_count": 0,
        "forks_count": 0
    }
]
```


--------------
Get file from repository   获取文件列表

**2. List repository tree**
###### 接口功能
> 查询项目结构

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
> 地址：[https://gitlab.com/api/v3/projects?private_token=Ec62sMY45Kezs7HWjxzW](https://gitlab.com/api/v3/projects?private_token=Ec62sMY45Kezs7HWjxzW)
``` javascript
[
    {
        "id": 459619,
        "description": "a TODO app build with backbone.js, grunt yeaman and bower",
        "default_branch": "master",
        "tag_list": [],
        "public": true,
        "archived": false,
        "visibility_level": 20,
        "ssh_url_to_repo": "git@gitlab.com:FrankFan/backbone-todos.git",
        "http_url_to_repo": "https://gitlab.com/FrankFan/backbone-todos.git",
        "web_url": "https://gitlab.com/FrankFan/backbone-todos",
        "owner": {
            "name": "FrankFan",
            "username": "FrankFan",
            "id": 244947,
            "state": "active",
            "avatar_url": "https://secure.gravatar.com/avatar/347f3740e6de7b32c185a9bb130b312e?s=40&d=identicon",
            "web_url": "https://gitlab.com/u/FrankFan"
        },
        "name": "backbone-todos",
        "name_with_namespace": "FrankFan / backbone-todos",
        "path": "backbone-todos",
        "path_with_namespace": "FrankFan/backbone-todos",
        "issues_enabled": true,
        "merge_requests_enabled": true,
        "wiki_enabled": true,
        "snippets_enabled": false,
        "created_at": "2015-09-11T18:19:03.834Z",
        "last_activity_at": "2015-09-11T18:19:03.834Z",
        "creator_id": 244947,
        "namespace": {
            "id": 287937,
            "name": "FrankFan",
            "path": "FrankFan",
            "owner_id": 244947,
            "created_at": "2015-09-11T17:44:54.602Z",
            "updated_at": "2015-09-11T17:44:54.602Z",
            "description": "",
            "avatar": null,
            "membership_lock": false
        },
        "avatar_url": null,
        "star_count": 0,
        "forks_count": 0
    }
]



## UI

```css
.gitlab-tree {
    width: 300px;
}

header {
    margin-left: 300px;
}

nav {
    margin-left: 300px;
}

.container {
    margin-left: 300px;
}
```

通过动态修改 `sidebar` 和 `mainContent` 的间距。

