
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
            private_token = private_token.replace(/\"/g, '');
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

                        // 实例化一棵树
                        $('.gitlab-tree nav').jstree({
                            'core': {
                                'data': dataDisplay,
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

                                // 获取当前select节点+所有父节点的text
                                // ["j1_13", "j1_3", "#"]
                                arrParents.forEach(function(item){
                                    if (item !== '#') {
                                        var tmpText = $(".gitlab-tree nav").jstree(true).get_text(item);
                                        path += tmpText + '/';
                                    }
                                });

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

                                // data.node.parents
                                // ["j1_13", "j1_3", "#"]
                                arrParents.forEach(function(item){
                                    if (item !== '#') {
                                        var tmpText = $(".gitlab-tree nav").jstree(true).get_text(item);
                                        path += tmpText + '/';
                                    }
                                });

                                path = revertPath(path);
                                // http://gitlab.lujs.cn /   mobile/m-web           /blob/   master            /     src/main/webapp/resource/loader.js
                                var href = originUrl + '/' + path_with_namespace + '/blob/' + repository_ref + '/' + path;
                                console.log(href);
console.log(' pjax  4');
                                window.location.href = href;
                            }
                        });

                        hackStyle();

                        enablePJAX();
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

function enablePJAX() {
    if ($.support.pjax) {

        console.log('支持 pjax  = ' + $.support.pjax);

        // $(document).on('click', '.gitlab-tree nav a', function(event) {
        //     var container = $('.content').parent();
        //     container.attr('id', 'myContainer');
        //     // $.pjax.click(event, {
        //     //     container: container
        //     // })
        //     // $(document).pjax('.gitlab-tree nav a', '#myContainer', {
        //     //     fragment: '#myContainer',
        //     //     timeout: 6000
        //     // });
        //     console.log(' pjax  2');
            
        // })


        // $(document).on('click', '.gitlab-tree nav a', function(event) {
        //     var container = $('.content').parent();
        //     container.attr('id', 'myContainer');
        //     console.log(' pjax  3');
        //     $.pjax.click(event, container)
        // })

        var container = $('.content').parent();
        container.attr('id', 'myContainer');
        $(document).pjax('.gitlab-tree nav a', '#myContainer', {
            fragment: '#myContainer',
            timeout: 6000
        });




console.log(' pjax  sss');
        $(document).on('pjax:send', function() {
            //执行pjax开始，在这里添加要重载的代码，可自行添加loading动画代码。例如你已调用了NProgress，在这里添加 NProgress.start();
            console.log('pjax:send');
        });
        $(document).on('pjax:complete', function() {
            //执行pjax结束，在这里添加要重载的代码，可自行添加loading动画结束或隐藏代码。例如NProgress的结束代码 NProgress.done();
            console.log('pjax:complete');
        });
console.log(' pjax  ccc');
    }



    $(function() {
        
        //这是a标签的pjax。#content 表示执行pjax后会发生变化的id，改成你主题的内容主体id或class。timeout是pjax响应时间限制，如果在设定时间内未响应就执行页面转跳，可自由设置。
        // $(document).pjax('a', '#content', {
        //     fragment: '#content',
        //     timeout: 6000
        // }); 

        //这是提交表单的pjax。form表示所有的提交表单都会执行pjax，比如搜索和提交评论，可自行修改改成你想要执行pjax的form id或class。#content 同上改成你主题的内容主体id或class。
        // $(document).on('submit', 'form', function(event) {
        //     $.pjax.submit(event, '#content', {
        //         fragment: '#content',
        //         timeout: 6000
        //     });
        // });

        // $(document).on('pjax:send', function() {
        //     //执行pjax开始，在这里添加要重载的代码，可自行添加loading动画代码。例如你已调用了NProgress，在这里添加 NProgress.start();
        // });
        // $(document).on('pjax:complete', function() {
        //     //执行pjax结束，在这里添加要重载的代码，可自行添加loading动画结束或隐藏代码。例如NProgress的结束代码 NProgress.done();
        // });
    });
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