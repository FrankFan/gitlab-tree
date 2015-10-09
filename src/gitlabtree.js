
// 全局变量
var private_token,
    project_id,
    repository_ref,
    apiRepoTree;

window.addEventListener("load", myMain, false);

function myMain(evt) {
    $(function() {
        if ($('head script[type="text/javascript"]').contents()[0]) {
            private_token = getPrivateToken($('head script[type="text/javascript"]').contents()[0]['wholeText']);
            private_token = private_token.replace(/\"/g, '');
            project_id = $('#project_id').val();
            repository_ref = $('#repository_ref').val();

            var repoName;
            var path_with_namespace;
            var originUrl = window.location.origin;
            // var apiRootUrl = 'https://gitlab.com/api/v3/projects/';
            // var apiRootUrl = 'http://gitlab.lujs.cn/api/v3/projects/';

            var apiRootUrl = originUrl + '/api/v3/projects/';
            var apiProjects = apiRootUrl;
            apiRepoTree = apiRootUrl + project_id + '/repository/tree';
            var apiFileContent = apiRootUrl + project_id + '/repository/files';

            console.log('request apiProjects: ' + apiProjects);


            // 1. 获取
            $.get(apiProjects, {
                private_token: private_token
            }, function(repos) {
                for (var key in repos) {
                    var objRepoInfo = repos[key];
                    var path;
                    if (objRepoInfo.id == project_id) {

                        path = objRepoInfo.path;
                        repoName = objRepoInfo.name;
                        path_with_namespace = objRepoInfo.path_with_namespace;
                    }
                }
                console.log('request apiRepoTree: ' + apiRepoTree);

                $.get(apiRepoTree, {
                    private_token: private_token,
                    id: project_id,
                    // path: path,
                    ref_name: repository_ref
                }, function(result) {
                    console.log('request apiRepoTree result.length = ' + result.length);
                    
                    if (isFilesTab()) {

                        // 动态创建一个div
                        // var htmlTemplate = '<div class="gitlab-tree"><nav><ul>';
                        // for (var key in result) {
                        //     var currentObj = result[key];
                        //     var li = '<li data-type="' + currentObj.type + '" data-name="' + currentObj.name + '">';
                        //     var href = '/' + path_with_namespace + '/blob/' + repository_ref + '/' + currentObj.name;
                        //     var tagA = '<a href=' + href + '>' + currentObj.name + '</a>';
                        //     li += tagA;
                        //     li += '</li>';
                        //     htmlTemplate += li;
                        // }
                        // htmlTemplate += '</ul></nav></div>';


                        // 动态创建一个div
                        var htmlTemplate = '<div class="gitlab-tree"><nav>';
                        htmlTemplate += '</nav></div>';
                        // 创建一个container
                        $('body').append(htmlTemplate);

                        // 构建一颗子树
                        var dataDisplay = [];
                        result.forEach(function(item) {
                            var singleObj = {};
                            singleObj.text = item.name;
                            if (item.type === 'tree') {
                                singleObj.children = [];
                                singleObj.data = 'tree';
                            } else if (item.type === 'blob') {
                                singleObj.icon = 'icon-file';
                                singleObj.data = 'blob';
                            }

                            dataDisplay.push(singleObj);
                        });

                        // var dataDisplay = [{
                        //     "text": "Root node",
                        //     "children": [{
                        //         "text": "Child node 1"
                        //     }, {
                        //         "text": "Child node 2",
                        //         "children": [{
                        //             "text": "这是子树的child"
                        //         }]
                        //     }]
                        // }];



                        $('.gitlab-tree nav').jstree({
                            'core': {
                                'data': dataDisplay,
                                'check_callback': true
                            },
                            plugins : ['wholerow']
                        });

                        $('.gitlab-tree nav').on("changed.jstree", function(e, data) {
                            var selectNode = $(".gitlab-tree nav").jstree('get_selected');
 
                            console.log(selectNode);


                            // var newNode = {
                            //     state: "open",
                            //     data: "New nooooode!",
                            //     text: '新节点',
                            //     id: 'new_node_id',
                            //     icon: 'icon-file'
                            // };
                            // $(".gitlab-tree nav").jstree(true).create_node(parent, newNode, 'last');
                            // $(".gitlab-tree nav").jstree(true).open_all();


                            if (data && data.node && data.node.data == 'tree') {
                                var path = data.node.text;
                                var currentNodeId = data.node.id;

                                var parentNode = $(".gitlab-tree nav").jstree(true).get_parent(currentNodeId);

                                console.log(parentNode);


                                // 获取select节点+ 父节点的text
                                var currentNodeText = data.node.text;
                                var arrParents = data.node.parents;

                                path = currentNodeText + '/';

                                // data.node.parents
                                // ["j1_13", "j1_3", "#"]
                                arrParents.forEach(function(item){
                                    if (item !== '#') {
                                        var tmpText = $(".gitlab-tree nav").jstree(true).get_text(item);
                                        path += tmpText + '/';
                                    }
                                });

                                console.log('path = ' + path);

                                // path = "main/src/"
                                path = revertPath(path);


                                // 如果已经加载过了，就不要重复加载了
                                if (localStorage.getItem('path') == path) {
                                    console.log('the same path, abort');
                                    return;
                                }
                                
                                // 获取子目录结构
                                $.get(apiRepoTree, {
                                    private_token: private_token,
                                    id: project_id,
                                    path: path,
                                    ref_name: repository_ref
                                }, function(result) {
                                    console.dir(result);

                                    localStorage.setItem('path', path);

                                    var nodesDisplay = [];
                                    result.forEach(function(item) {
                                        var singleObj = {};
                                        singleObj.text = item.name;

                                        if (item.type === 'tree') {
                                            singleObj.children = [];
                                            singleObj.data = 'tree';
                                        } else if (item.type === 'blob') {
                                            singleObj.icon = 'icon-file';
                                            singleObj.data = 'blob';
                                        }

                                        nodesDisplay.push(singleObj);
                                    });

                                    nodesDisplay.forEach(function(item) {
                                        $(".gitlab-tree nav").jstree(true).create_node(selectNode, item, 'last');
                                    });
                                    
                                    // $(".gitlab-tree nav").jstree(true).open_all();
                                    $(".gitlab-tree nav").jstree(true).open_node(selectNode);

                                });
                            } else { // blob
                                // 文件，通过url获取内容
                            }
                        });

                        hackStyle();

                        // When the jsTree is ready, add two more records.
                        // $('.gitlab-tree nav').on('ready.jstree', function (e, data) {
                        //     $(".gitlab-tree nav").jstree(true).select_node('j1_2');
                        // });
                    }

                });
            });
        }
    });
}
// 获取private_token
function getPrivateToken(strXml) {
    var arrXmlNode = strXml.toString().split(';')
    var private_token;
    var objXml = {};
    for (var i = 1; i < arrXmlNode.length - 1; i++) {
        var item = arrXmlNode[i].split('=');
        var key = item[0];
        var value = item[1];
        objXml[key] = value;
    }
    for (var key in objXml) {
        if (key === 'gon.api_token') {
            private_token = objXml[key];
        }
    }
    return private_token;
}

function ajaxGet(url, params, success) {
    console.log('ajaxGet come in');
    $.get(url, params, function(data) {
        console.log('ajaxGet success');
        success(data);
    });
}
// get repo tree recursively
// 不能使用递归获取目录结构的方法， 太慢了，浏览器爆掉了
function getRepoTreeRecursively(url, params, path) {
    ajaxGet(url, params, function(result) {
        console.log(result);
        for (var i = 0; i < result.length; i++) {
            var item = result[i];
            if (item.type == 'tree') {
                console.log(item.name + '这是tree');
                var path2 = path + '/' + item.name;
                $.extend(params, {
                    path: path2
                })
                getRepoTreeRecursively(url, params, path2);
            } else {
                console.log(item.name + '这不是tree');
            }
        };
    });
}
// 处理右侧gitlab的宽度
function hackStyle() {
    if (location.href.indexOf('gitlab.com') > -1) {
        $('.sidebar-wrapper').hide();
        $('.gitlab-tree').css('width', '230px');
    } else {
        $('header.navbar').css('margin-left', '300px');
        $('nav.main-nav').css('margin-left', '300px');
        $('.container').css('margin-left', '300px');
        $('body').css('overflow', 'hidden');
    }
}

// 判断当前是否是Files Tab
function isFilesTab() {
    var currentTabText = $('.project-navigation li.active a').text();
    if (currentTabText === 'Files') {
        return true;
    }
    return false;
}


// Helper method createNode(parent, id, text, position).
// Dynamically adds nodes to the jsTree. Position can be 'first' or 'last'.
function createNode(parent_node, new_node_id, new_node_text, position) {
    $('.gitlab-tree nav').jstree('create_node', $(parent_node), {
        "text": new_node_text,
        "id": new_node_id
    }, position, false, false);
}

// path = "java/main/src/"
//    --> "src/main/java"
function revertPath(revertedPathString) {
    var retString = '';
    var arrString = revertedPathString.split('/');
    
    // 1 删除空元素
    arrString.forEach(function(item, index){
        if (item === '') {
            removeElement(index, arrString);
        }
    });

    // 2.倒序排列
    for (var i = arrString.length - 1; i >= 0; i--) {
        var item = arrString[i];
        console.log('index = ' + i + ' item = ' + item);
        retString += item + '/';
    };

    console.log('retString = ' + retString);
    return retString;
}


// 删除数组中指定的元素
function removeElement(index, array) {
    if (index >= 0 && index < array.length) {
        for (var i = index; i < array.length; i++) {
            array[i] = array[i + 1];
        }
        array.length = array.length - 1;
    }
    return array;
}