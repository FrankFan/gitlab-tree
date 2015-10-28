# gitlab_API

![](http://images2015.cnblogs.com/blog/282019/201510/282019-20151020103628145-762219576.jpg)

gitlab提供了各种语言的API,但是唯独没有`js`的。看了 `gitlab` 的API文档后发现这些API可以通过`ajax`请求模拟。


## Dependency GitLab API

* `GET /projects`
  * http://doc.gitlab.com/ce/api/projects.html#list-projects
* `GET /projects/:id/repository/tree`
  * http://doc.gitlab.com/ce/api/repositories.html#list-repository-tree


### 参考：
  [1] http://gxxsite.com/content/view/id/150.html
  
  [2] http://www.ueffort.com/pjax-ji-shu/