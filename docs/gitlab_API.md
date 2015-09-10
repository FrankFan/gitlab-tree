# gitlab_API

  [1]: http://doc.gitlab.com/ce/api/repositories.html
  [2]: http://gitlab.lujs.cn/api/v3/projects/
  [3]: http://doc.gitlab.com/ce/api/repository_files.html
  [4]: https://gitlab.com/gitlab-org/gitlab-ce/tree/master#README

gitlab官方没有找到对应的javascript API，只好自己写一套了。

1. 获取 `private_token`


测试：
curl --header "PRIVATE-TOKEN: QVy1PB7sTxfy4pqfZM1U" "http://gitlab.lujs.cn/api/v3/projects/"

http://gitlab.lujs.cn/api/v3/projects/

curl --header "PRIVATE-TOKEN: f5o7jas_rQYPCCLHxKVy" "http://gitlab.lujs.cn/api/v3/projects/"



curl --header "PRIVATE-TOKEN: f5o7jas_rQYPCCLHxKVy" "http://gitlab.lujs.cn/api/v3/projects/613/repository/files?file_path=zip.sh&ref=master"
GET /projects/:id/repository/files
GET /projects/613/repository/files

/projects/:id/repository/archive
/projects/613/repository/archive

curl --header "PRIVATE-TOKEN: f5o7jas_rQYPCCLHxKVy" "http://gitlab.lujs.cn/api/v3/projects/613/repository/archive"



/projects/:id/repository/tree
/projects/613/repository/tree
curl --header "PRIVATE-TOKEN: f5o7jas_rQYPCCLHxKVy" "http://gitlab.lujs.cn/api/v3/projects/613/repository/tree"