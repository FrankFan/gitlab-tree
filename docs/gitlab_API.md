# gitlab_API

  [1]: http://doc.gitlab.com/ce/api/repositories.html
  [2]: http://gitlab.lujs.cn/api/v3/projects/
  [3]: http://doc.gitlab.com/ce/api/repository_files.html
  [4]: https://gitlab.com/gitlab-org/gitlab-ce/tree/master#README

gitlab官方没有找到对应的javascript API，只好自己写一套了。

1. 获取 `private_token`

登录之前：
//<![CDATA[
window.gon={};gon.default_issues_tracker="gitlab";gon.api_version="v3";gon.relative_url_root="";gon.default_avatar_url="http://gitlab.lujs.cn/assets/no_avatar-adffbfe10d45b20495cd2a9b88974150.png";
//]]>

登录之后：
//<![CDATA[
window.gon={};gon.default_issues_tracker="gitlab";gon.api_version="v3";gon.relative_url_root="";gon.default_avatar_url="http://gitlab.lujs.cn/assets/no_avatar-adffbfe10d45b20495cd2a9b88974150.png";gon.current_user_id=516;gon.api_token="f5o7jas_rQYPCCLHxKVy";
//]]>


$('head script[type="text/javascript"]').contents()

[//<![CDATA[
window.gon={};gon.default_issues_tracker="gitlab";gon.api_version="v3";gon.relative_url_root="";gon.default_avatar_url="http://gitlab.lujs.cn/assets/no_avatar-adffbfe10d45b20495cd2a9b88974150.png";gon.current_user_id=516;gon.api_token="f5o7jas_rQYPCCLHxKVy";
//]]>
]


优先这样取 ： window.gon.api_token
拿不到在这样取：
$('head script[type="text/javascript"]').contents()[0]['wholeText']


测试：

curl --header "PRIVATE-TOKEN: QVy1PB7sTxfy4pqfZM1U" "http://gitlab.lujs.cn/api/v3/projects/"

http://gitlab.lujs.cn/api/v3/projects/

curl --header "PRIVATE-TOKEN: f5o7jas_rQYPCCLHxKVy" "http://gitlab.lujs.cn/api/v3/projects/"



var first_script_element = document.getElementsByTagName("script").item(0);
var script_data = first_script_element.firstChild.data; // or
script_data = first_script_element.firstChild.nodeValue;


curl --header "PRIVATE-TOKEN: f5o7jas_rQYPCCLHxKVy" "http://gitlab.lujs.cn/api/v3/projects/613/repository/files?file_path=zip.sh&ref=master"
GET /projects/:id/repository/files
GET /projects/613/repository/files

/projects/:id/repository/archive
/projects/613/repository/archive

curl --header "PRIVATE-TOKEN: f5o7jas_rQYPCCLHxKVy" "http://gitlab.lujs.cn/api/v3/projects/613/repository/archive"



/projects/:id/repository/tree
/projects/613/repository/tree
curl --header "PRIVATE-TOKEN: f5o7jas_rQYPCCLHxKVy" "http://gitlab.lujs.cn/api/v3/projects/613/repository/tree"