/*
* @Author: fanyong@gmail.com
* @Date:   2015-10-20
* @Last Modified by:  FrankFan
*/

var GitlabTree = (function($){
    // 全局变量
    var private_token,
        project_id,
        repository_ref,
        apiRepoTree,
        path_with_namespace,
        apiProjects,
        originUrl,
        $jstree;

    // 获取private_token
    var getPrivateToken = function(strXml) {
        var arrXmlNode;
        var private_token;
        var objXml = {};


        if($('head script[type="text/javascript"]').contents()[0]) {
            arrXmlNode = strXml.toString().split(';')    
        } else {
            return false;
        }
        
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

        if (private_token) {
            private_token = private_token.replace(/\"/g, '');
        } else {
            console.log('token获取失败');
            quit();
            return false;
        }

        return private_token;
    }

    var initVariables = function() {
        project_id = $('#project_id').val();
        repository_ref = $('#repository_ref').val();
        originUrl = window.location.origin;

        var apiRootUrl = originUrl + '/api/v3/projects/';
        apiProjects = apiRootUrl;
        apiRepoTree = apiRootUrl + project_id + '/repository/tree';
        var apiFileContent = apiRootUrl + project_id + '/repository/files';

        localStorage.removeItem('loadedDirs');
    }

    // 处理右侧gitlab的宽度
    var hackStyle = function() {
        if (location.href.indexOf('gitlab.com') > -1) {
            $('.sidebar-wrapper').hide();
            $('.gitlab-tree').css('width', '230px');
            $('header.navbar').css('margin-left', '230px');
        } else {
            hideGitlabTree();
            $('body').css('overflow', 'hidden');
        }

        $('.breadcrumb').addClass('vh');
    }

    var handlePJAX = function() {
        if ($.support.pjax) {
            $(document).on('pjax:complete', function() {
                $('pre code').each(function(i, block) {
                    hljs.highlightBlock(block);
                });
            });

            $(document).on('pjax:start', function() {
                NProgress.start();
                showLoading();
            });
            $(document).on('pjax:end', function() {
                NProgress.done();
                hideLoading();
            });
        }
    }

    // 判断当前是否是Files Tab
    var isFilesTab = function() {

        var currentTabText = $('.project-navigation li.active a').text();
        if (currentTabText === 'Files' || $('.nav.nav-sidebar li.active a').text().trim() === 'Files') {
            return true;
        }
        return false;
    }

    // path = "java/main/src/"
    //    --> "src/main/java"
    var revertPath = function(revertedPathString) {
        
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
    var removeElement = function(index, array){
        
        if (index >= 0 && index < array.length) {
            for (var i = index; i < array.length; i++) {
                array[i] = array[i + 1];
            }
            array.length = array.length - 1;
        }
        return array;
    }

    var createGitlabTreeContainer = function() {
        // 创建一个container
        var htmlTemplate = '<div class="gitlab-tree">\
                                <header>\
                                    <div class="head">\
                                        <div class="info">\
                                            <i class="fa fa-lock"></i><a href="/groups/mobile" target="_blank"></a> / <span></span>\
                                        </div>\
                                        <i class="fa fa-code-fork"></i><span class="branch"></span>\
                                        <a class="gitlabtree_toggle toggle-btn icon-white icon-arraw-left toggle-btn-color">\
                                            <div class="loader icon-loading" style="display: none;"></div>\
                                        </a>\
                                    </div>\
                                </header>';
        htmlTemplate += '<nav></nav></div>';
        $('body').append(htmlTemplate);

        $('.gitlab-tree div.info a').text(path_with_namespace.split('/')[0]);
        $('.gitlab-tree div.info span').text(path_with_namespace.split('/')[1]);
        $('.gitlab-tree span.branch').text(repository_ref);
    }


    // 构建一颗子树
    var createGitlabTree = function(result) {
        
        var subTreeData = [];
        result.forEach(function(item) {
            var singleObj = {};
            singleObj.text = item.name;
            if (item.type === 'tree') {
                singleObj.children = [];
                singleObj.data = 'tree';
                singleObj.icon = 'fa fa-folder';
            } else if (item.type === 'blob') {
                singleObj.icon = 'fa fa-file-o';
                singleObj.data = 'blob';
            }

            subTreeData.push(singleObj);
        });

        // 实例化一棵树
        $jstree = $('.gitlab-tree nav').jstree({
            'core': {
                'data': subTreeData,
                'check_callback': true
            },
            plugins: ['wholerow']
        });
    }

    // 监听tree node 事件
    var selectNode = function() {
        
        $jstree.on("select_node.jstree", function(e, data) {
            var selectNode = $jstree.jstree('get_selected');

            if (data && data.node && data.node.data == 'tree') {
                var path = data.node.text;
                var currentNodeId = data.node.id;
                var parentNode = $jstree.jstree(true).get_parent(currentNodeId);

                // 获取select节点+ 父节点的text
                var currentNodeText = data.node.text;
                var arrParents = data.node.parents;

                path = currentNodeText + '/';

                // 获取当前select节点+所有父节点的text  ["j1_13", "j1_3", "#"]
                arrParents.forEach(function(item){
                    if (item !== '#') {
                        var tmpText = $jstree.jstree(true).get_text(item);
                        path += tmpText + '/';
                    }
                });

                // path = "java/main/src/"
                path = revertPath(path);

                // 如果已经加载过了，就不要重复加载了
                var arrClickedDir = localStorage.getItem('loadedDirs');
                if (arrClickedDir) {
                    arrClickedDir = arrClickedDir.split(',');
                }

                if (arrClickedDir && arrClickedDir.indexOf(path) > -1) {
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

                    var arrClickedDir = localStorage.getItem('loadedDirs');
                    if (arrClickedDir) {
                        arrClickedDir = arrClickedDir.split(',');
                        arrClickedDir.push(path);
                    }

                    if (arrClickedDir && Array.isArray(arrClickedDir)) {
                        localStorage.setItem('loadedDirs', arrClickedDir.join(','));    
                    } else {
                        localStorage.setItem('loadedDirs', path);
                    }

                    var nodesDisplay = [];
                    result.forEach(function(item) {
                        var singleObj = {};
                        singleObj.text = item.name;

                        if (item.type === 'tree') {
                            singleObj.children = [];
                            singleObj.data = 'tree';
                            singleObj.icon = 'fa fa-folder';
                        } else if (item.type === 'blob') {
                            singleObj.icon = 'fa fa-file-o';
                            singleObj.data = 'blob';
                        }

                        nodesDisplay.push(singleObj);
                    });

                    nodesDisplay.forEach(function(item) {
                        $jstree.jstree(true).create_node(selectNode, item, 'last');
                    });
                    
                    // $(".gitlab-tree nav").jstree(true).open_all();
                    // $(".gitlab-tree nav").jstree(true).close_all();
                    $jstree.jstree(true).open_node(selectNode);

                });
            } else { // blob

                var href = getClickedFileFullPath(data);

                // fix pjax link.href can't contains '#'
                var snode = $jstree.jstree(true).get_node(selectNode, true);
                $(snode.find('a'))[0].href = href;
                
                // 只能这样写否则就不work了……
                $(document).pjax('.gitlab-tree nav a.jstree-clicked', '#tree-content-holder', {fragment:'#tree-content-holder', timeout:9000});
            }
        });

        // handle open node state
        openCloseNode();
    }

    var openCloseNode = function() {
        $jstree.on("before_open.jstree", function(e, data) {
            showLoading();
        });

        $jstree.on("after_open.jstree", function(e, data) {
            hideLoading();
        });
    }

    var getClickedFileFullPath = function(data) {
        var path = data.node.text + '/';
        var arrParents = data.node.parents;

        // data.node.parents ["j1_13", "j1_3", "#"]
        arrParents.forEach(function(item) {
            if (item !== '#') {
                var tmpText = $jstree.jstree(true).get_text(item);
                path += tmpText + '/';
            }
        });

        path = revertPath(path);

        // http://gitlab.xxx.cn /   mobile/m-web           /blob/   master            /     src/main/webapp/resource/loader.js
        var href = originUrl + '/' + path_with_namespace + '/blob/' + repository_ref + '/' + path;

        return href;
    }

    var handleToggleBtn = function() {
        $('.gitlab-tree header a.toggle-btn').on('click', function() {
            hideGitlabTree();
            createBtn();
        });
    }

    var createBtn = function() {
        if ($('.open-tree').length === 0) {
            var htmlTemplate = '<div class="open-tree fa fa-angle-right"></div>';
            $('body').append(htmlTemplate);  

            $('.open-tree').on('click', function() {
                showGitlabTree();
            });  
        } else {
            $('.open-tree').show();
        }
    }

    var hideGitlabTree = function() {
        $('.gitlab-tree').hide();
        updateLayoutUI('hide');    
    }

    var showGitlabTree = function(){
        $('.gitlab-tree').show();
        updateLayoutUI('show');    
    }

    var updateLayoutUI = function(operateType) {
        var screenWidth = window.innerWidth;

        if (operateType === 'hide') {
            if (screenWidth < 768) {
                $('.container').css('padding-left', '0');
            } else {
                $('.container').css('padding-left', '0');
            }

            $('.container').css('margin-left', '274.5px');
        } else {
            if (screenWidth <= 1400) {
                $('.container').css('padding-left', '300px');
            } else {
                $('.container').css('padding-left', '0');
            }

            var containerML = $('.container').css('margin-left').replace('px','');
            if (+containerML < 300) {
                $('.container').css('padding-left', '300px');
                $('.container').css('margin-left', '10px');
            }
        }
    }

    // 显示tree里面的loading
    var showLoading = function() {
        $('.loader').show();
        $('.toggle-btn').removeClass('toggle-btn-color');
    }

    var hideLoading = function() {
        $('.loader').hide();
        $('.toggle-btn').addClass('toggle-btn-color');
    }

    // 显示tree外面的loading
    var showSpinner = function() {
        $('.open-tree')
            .removeClass('fa fa-angle-right')
            .addClass('busy')
            .append('<i class="fa fa-spinner fa-spin"></i>');
    }

    var hideSpinner = function() {
        $('.open-tree')
            .addClass('fa fa-angle-right')
            .removeClass('busy');
        $('.open-tree i').removeClass('fa fa-spinner fa-spin');
    }

    var checkRepos = function(repos) {
        var result = true;

        if (repos && repos.length > 0) {
            for (var key in repos) {
                var objRepoInfo = repos[key];
                var path;
                if (objRepoInfo.id == project_id) {
                    path = objRepoInfo.path;
                    repoName = objRepoInfo.name;
                    path_with_namespace = objRepoInfo.path_with_namespace;
                }
            }

            if (!path_with_namespace) {
                console.log('如果path_with_namespace没拿到，再拿一遍');
                path_with_namespace = $('.home a').attr('href');
                var firstChar = path_with_namespace.substring(0, 1);
                if (firstChar && firstChar === '/') {
                    path_with_namespace = path_with_namespace.substr(1);
                }
            }

            if (!path_with_namespace) {
                quit();
                result = false;
            }

            if (!repository_ref) {
                quit();
                result = false;
            }
        }

        return result;
    }

    var quit = function () {
        hideSpinner();
        $('.open-tree').hide();
    }


    // --------------------------------- export ---------------------------------

    var init = function() {

        private_token = getPrivateToken($('head script[type="text/javascript"]').contents()[0]['wholeText']);

        if (!private_token) {
            return;
        }

        createBtn();

        showSpinner();

        initVariables();
    }

    var getApiProjects = function() {
        $.get(apiProjects, {private_token: private_token})
            .done(function(repos){

                var checkResult = checkRepos(repos);
                if (checkResult == false) {
                    return;
                }

                // 2. 获取repo代码目录结构
                $.get(apiRepoTree, {
                    private_token: private_token,
                    id: project_id,
                    // path: path,
                    ref_name: repository_ref
                })
                .done(function(result) {
                    hideSpinner();

                    if (isFilesTab()) {

                        createGitlabTreeContainer();

                        createGitlabTree(result);

                        selectNode();

                        hackStyle();

                        handlePJAX();

                        handleToggleBtn();
                    }
                });

            });
    }

    return {
        init: init,
        action: getApiProjects
    }
})(jQuery);



window.addEventListener("load", myMain, false);

function myMain(evt) {
    $(function() {

        GitlabTree.init();

        GitlabTree.action();
        
    });
}