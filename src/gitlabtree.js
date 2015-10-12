
// 全局变量
var private_token,
    project_id,
    repository_ref,
    apiRepoTree,
    path_with_namespace,
    originUrl;

window.addEventListener("load", myMain, false);

function myMain(evt) {
    $(function() {
        if ($('head script[type="text/javascript"]').contents()[0]) {
            private_token = getPrivateToken($('head script[type="text/javascript"]').contents()[0]['wholeText']);
            if (private_token) {
                private_token = private_token.replace(/\"/g, '');
            } else{
                console.log('token获取失败');
                return;
            }
            
            project_id = $('#project_id').val();
            repository_ref = $('#repository_ref').val();

            var repoName;
            originUrl = window.location.origin;
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

                if (!path_with_namespace) {
                    console.log('如果path_with_namespace没拿到，再拿一遍');
                    path_with_namespace = $('.home a').attr('href');    
                }

                $.get(apiRepoTree, {
                    private_token: private_token,
                    id: project_id,
                    // path: path,
                    ref_name: repository_ref
                }, function(result) {
                    console.log('request apiRepoTree result.length = ' + result.length);
                    
                    if (isFilesTab()) {

                        // 创建一个container
                        var htmlTemplate = '<div class="gitlab-tree"><nav>';
                        htmlTemplate += '</nav></div>';
                        $('body').append(htmlTemplate);

                        // 构建一颗子树
                        var subTreeData = [];
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

                            subTreeData.push(singleObj);
                        });

                        // var subTreeData = [{
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

                        // 实例化一棵树
                        $('.gitlab-tree nav').jstree({
                            'core': {
                                'data': subTreeData,
                                'check_callback': true
                            },
                            plugins : ['wholerow']
                        });

                        $('.gitlab-tree nav').on("changed.jstree", function(e, data) {
                            var selectNode = $(".gitlab-tree nav").jstree('get_selected');

                            if (data && data.node && data.node.data == 'tree') {
                                var path = data.node.text;
                                var currentNodeId = data.node.id;
                                var parentNode = $(".gitlab-tree nav").jstree(true).get_parent(currentNodeId);

                                // 获取select节点+ 父节点的text
                                var currentNodeText = data.node.text;
                                var arrParents = data.node.parents;

                                path = currentNodeText + '/';

                                // 获取当前select节点+所有父节点的text  ["j1_13", "j1_3", "#"]
                                arrParents.forEach(function(item){
                                    if (item !== '#') {
                                        var tmpText = $(".gitlab-tree nav").jstree(true).get_text(item);
                                        path += tmpText + '/';
                                    }
                                });

                                // path = "java/main/src/"
                                path = revertPath(path);


                                // 如果已经加载过了，就不要重复加载了
                                if (localStorage.getItem('path') == path) {
                                    console.log('loaded the same path, abort');
                                    return;
                                }
                                
                                // 获取子目录结构
                                $.get(apiRepoTree, {
                                    private_token: private_token,
                                    id: project_id,
                                    path: path,
                                    ref_name: repository_ref
                                }, function(result) {

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
                                var path = data.node.text + '/';
                                var arrParents = data.node.parents;

                                // data.node.parents ["j1_13", "j1_3", "#"]
                                arrParents.forEach(function(item){
                                    if (item !== '#') {
                                        var tmpText = $(".gitlab-tree nav").jstree(true).get_text(item);
                                        path += tmpText + '/';
                                    }
                                });

                                path = revertPath(path);

                                // http://gitlab.lujs.cn /   mobile/m-web           /blob/   master            /     src/main/webapp/resource/loader.js
                                var href = originUrl + '/' + path_with_namespace + '/blob/' + repository_ref + '/' + path;
                                console.log('href = ' + href);

                                var snode = $(".gitlab-tree nav").jstree(true).get_node(selectNode, true);
                                $(snode.find('a'))[0].href = href;

                                // e.preventDefault()

                                var container = $('.content').parent();
                                container.attr('id', 'myContainer');

                                $(document).pjax('.gitlab-tree nav a', '#tree-content-holder', {fragment:'#tree-content-holder', timeout:9000});

                            }
                        });

                        // $('.gitlab-tree nav').on("select_node.jstree", function(e, data) {
                        //     console.log(e);
                        //     console.log(data);
                        //     var selectNode = $(".gitlab-tree nav").jstree('get_selected');
                        //     var path = data.node.text + '/';

                        //     var type = data.node.data;
                        //     if (type === 'blob') {
                        //         var arrParents = data.node.parents;

                        //         // data.node.parents ["j1_13", "j1_3", "#"]
                        //         arrParents.forEach(function(item){
                        //             if (item !== '#') {
                        //                 var tmpText = $(".gitlab-tree nav").jstree(true).get_text(item);
                        //                 path += tmpText + '/';
                        //             }
                        //         });

                        //         path = revertPath(path);

                        //         // http://gitlab.lujs.cn /   mobile/m-web           /blob/   master            /     src/main/webapp/resource/loader.js
                        //         var href = originUrl + '/' + path_with_namespace + '/blob/' + repository_ref + '/' + path;
                        //         console.log('href = ' + href);

                        //         var snode = $(".gitlab-tree nav").jstree(true).get_node(selectNode, true);
                        //         $(snode.find('a'))[0].href = href;

                        //         // e.preventDefault()

                        //         var container = $('.content').parent();
                        //         container.attr('id', 'myContainer');

                        //         $(document).pjax('.gitlab-tree nav a', '#tree-content-holder', {fragment:'#tree-content-holder', timeout:9000});
                        //     }

                        // });


                        hackStyle();

                        handlePJAX();
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

// 处理右侧gitlab的宽度
function hackStyle() {
    if (location.href.indexOf('gitlab.com') > -1) {
        $('.sidebar-wrapper').hide();
        $('.gitlab-tree').css('width', '230px');
        $('header.navbar').css('margin-left', '230px');
        // $('.content-wrapper').css('margin-left', '160px');
    } else {
        // $('header.navbar').css('margin-left', '300px');
        // $('nav.main-nav').css('margin-left', '300px');
        $('.container').css('margin-left', '300px');
        $('body').css('overflow', 'hidden');
    }
}

function handlePJAX() {

    if ($.support.pjax) {
        $(document).on('pjax:complete', function() {
            $('pre code').each(function(i, block) {
                hljs.highlightBlock(block);
            });
        });

        $(document).on('pjax:start', function() { NProgress.start(); });
        $(document).on('pjax:end',   function() { NProgress.done();  });
    }
}

// 判断当前是否是Files Tab
function isFilesTab() {
    var currentTabText = $('.project-navigation li.active a').text();

    if (currentTabText === 'Files' || $('.nav.nav-sidebar li.active a').text().trim() === 'Files') {
        return true;
    }
    return false;
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
        retString += item + '/';
    };

    // 3.去掉最后一个/
    if (retString.substr(retString.length - 1) === '/') {
        retString = retString.substr(0, retString.length - 1);    
    }

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
