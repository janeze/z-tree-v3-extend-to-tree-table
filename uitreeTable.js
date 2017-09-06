(function(root, factory) {
        root.TreeTable = factory();
})(this,function(){
	 //ztree结构样式片段
    var IDMark_Switch = "_switch",
        IDMark_Icon = "_ico",
        IDMark_Span = "_span",
        IDMark_Input = "_input",
        IDMark_Check = "_check",
        IDMark_Edit = "_edit",
        IDMark_Remove = "_remove",
        IDMark_Ul = "_ul",
        IDMark_A = "_a";
    //ztree配置
    var setting = {
        view: {
            addDiyDom: null,
            showLine: false,
            showIcon:false,
            selectedMulti: true
        },
        data: {
            simpleData: {
                enable:true,
                idKey: "id",//一般需要具体设置
                pIdKey: "parentId",//一般需要具体设置
                rootPId: ""
            },
            key:{
            	name:"name",//一般需要具体设置
            	checked:"isDefault",
            	url:false
        	},
        	keep:{
        		leaf:false,
        		parent:false
        	}
        },	
        callback: {
            beforeClick: function(treeId, treeNode,clickFlag) {
                if (treeNode.id === "title") {
                    return false;
                }
            },
            onClick:function(event, treeId, treeNode, clickFlag){
            }
        }
    };

    function TreeTable(options) {
        if (!options || typeof options !== "object") {
            options = {};
        }
        this.initSetting(setting, options);

        this.element = $("#" + this.id);
        this.element.data(this);
        this.element.addClass("ui-tree-table");
        this.element.addClass("ztree");

        if (options.autoUpdate) {
            this.update();
        }
        return this;
    }
    TreeTable.prototype = {
        constructor: TreeTable,
        _events: [],
        _attachEvents: function() {
            this._detachEvents();
            this._events = [];
            for (var i = 0, el, ev; i < this._events.length; i++) {
                el = this._events[i][0];
                ev = this._events[i][1];
                el.on(ev);
            }
            if(!this.events){
            	this.events=[];
            }
        },
        _detachEvents: function() {
            for (var i = 0, el, ev; i < this._events.length; i++) {
                el = this._events[i][0];
                ev = this._events[i][1];
                el.off(ev);
            }
            this._events = [];
        },
        initSetting: function(setting, options) {
        	for(var i in options){
        		if(i==="_events"){
        			this._events.concat(options[i]);
        			continue;
        		}
        		if(i=="tableCel"&&$.isArray(options[i])&&options[i].length>0){
        			var titleObj={
        				id:options.titleId,
        				name:options.titleText,
                        width:options.titleWidth,
                        isTitle:true
        			}
        			options[i].map(function(obj,i){
        				titleObj[obj.name]=obj.text;
        			});
        			this.titleObj=titleObj;
        		}
        		if(i!=="setting"){
        			this[i]=options[i];
        		}
        	}
            setting.view.addDiyDom=this.addDiyDom(this);
            this.setting = setting;
        },
        //获取数据
        getAjaxData: function() {
            var that = this;
            $.ajax({
                type: that.type||"get",
                url: that.url,
                data:that.ajaxData||{},
                success: function(zNodes) {
                    zNodes = zNodes ? zNodes : [];
                    if(!$.isArray(zNodes)){
                    	zNodes=$.parseJSON(zNodes);
                    }
                    
                    if(that.titleObj){
                    	zNodes.unshift(that.titleObj);
                    }
                    that.createTree(zNodes)
                },
                error: function(e) {
                    alert(String(e));
                }
            });
        },
        //格式化树节点
        formatzNodes:function(nodes){
            return nodes;
        },
        //绘制树
        createTree:function(zNodes){
            var that=this;
            if(that.formatzNodes&&typeof that.formatzNodes==="function"){
                zNodes=that.formatzNodes(zNodes);
            }
            $.fn.zTree.init($("#" + that.id), that.setting,zNodes );
            that._attachEvents();

            if(typeof that.afterUpdate==="function"){
                that.afterUpdate();
            }
        },
        //修改一个树节点（一行表格数据）
        addDiyDom:function() {
            var that=this;
            return function(treeId, treeNode){
                var switchEle = $("#" + treeNode.tId + IDMark_Switch);
                var aEle = $("#" + treeNode.tId + IDMark_A);
                var iconEle = $("#" + treeNode.tId + IDMark_Icon);

                var reg = /.*level(\d+).*/g;
                var level = Number(aEle.attr("class").replace(reg, "$1"));
                var indentStr = '<span class="ui-indent"></span>';//树的层级间隔
                var indentStrs = '';

                var checkWidth=that.checkWidth||"50px";
                var titleWidth=that.titleWidth||"200px";
                for (var i = 0; i < level; i++) {
                    indentStrs += indentStr;
                }

                //设置表格表头
                if (treeNode.id === that.titleId) { 
                    iconEle.remove();
                    aEle.addClass("ui-title");
                }

                //修改展开按钮结构位置
                aEle.prepend(switchEle);
                //修改原来的树控件结构，显示成树的层级间隔
                aEle.append($('<div class="ui-name" style="width:'+titleWidth+'">' + indentStrs + '</div>').append(aEle.children()));
                //向树控件添加checkbox
                aEle.prepend('<span class="ui-cel ui-check" style="width:'+checkWidth+'" title="单击时同时按下 Ctrl 键可以选中多个节点"></span>');
                
                //向树控件添加其他列
                var tableCel = that.tableCel||[],isTitle,node;
                for (var i = 0; i < tableCel.length; i++) {
                    isTitle=treeNode.isTitle;
                    if(isTitle){
                        node=that.createTitle(tableCel[i], treeNode);
                    }else{
                        node = that.createTreeCel(tableCel[i], treeNode);
                    }
                    
                    aEle.append(node);
                }
            };
        },
        //构造title列
        createTitle:function(celObj, treeNode){ 
            var name = celObj.name,//列名
                width = celObj.width||"100px",//列宽度
                blankText=celObj.blankText;
             //读取接口数据
            var nodeVal = treeNode[name];
            var that=this;
            var ele;
            ele=that.createStringCelOfTree(width,blankText,nodeVal);
            return ele;
        },
        //构造列
        createTreeCel:function(celObj, treeNode) {
            var type=celObj.type,//列类型
                name = celObj.name,//列名
                text=celObj.text,//列头显示文字
                width = celObj.width||"100px",//列宽度
                blankText=celObj.blankText,//没有数据时，内容显示空白数据
                param=celObj.param||{};//根据不同的列类型type会有不同的参数
             //读取接口数据
            var nodeVal = treeNode[name];
            var that=this;
            var ele;
            switch(type){
                case "operate"://操作列
                    ele=that.creatOperateCelOfTree(width,blankText,param);
                    break;
                case "tree"://树控件
                    ele=that.createTreeCelOfTree(width,blankText,param);
                    break;
                default://默认，string 类型
                    ele=that.createStringCelOfTree(width,blankText,nodeVal);
                    break;
            }
            return ele;
        },
        //构造string类型单元格
        createStringCelOfTree:function(width,blankText,nodeVal){
            if (nodeVal === undefined) {//接口返回没有数据时的处理
                if(blankText===undefined){
                    nodeVal = "";
                }else{
                    nodeVal = blankText;
                }
            }
            var ele = $('<span class="ui-cel" style="width:' + width + '" title="'+nodeVal+'">' + nodeVal + '</span>');
            return ele;
        },
        //构造树类型单元格
        createTreeCelOfTree:function(width,blankText,param){
            var ele;
            ele=$('<div class="ui-cel" style="width:' + width + '" title=""></div>');

            return ele;
        },
        //构造操作类型单元格
        creatOperateCelOfTree:function(width,blankText,param){
            var that=this;
            var list=param.list||[];
            var ele=$('<div class="ui-operate" style="width:'+width+'"></div>');
            var name,text,click,operateEle;
            for(var i=0;i<list.length;i++){
                name=list[i].name;
                text=list[i].text;
                click=list[i].click;
                operateEle=$('<a href="javascript:void(0)" name="'+name+'">'+text+'</a>');
                if(typeof click==="function"){
                    (function(click){
                        operateEle.bind("click",function(e){
                            setTimeout(function(){//设置一定的延迟，使得添加的事件在树节点选中之后再执行该事件
                                click.call(that,e);
                            },0);
                        })
                    })(click);
                    
                }
                ele.append(operateEle);
            }
            return ele;
        },
        destroy: function() {
            $.fn.zTree.destroy(this.id);
        },
        //更新树
        update: function() {
        	var that=this;
            if(that.url){//有url则异步获取数据
                that.destroy();
                that.getAjaxData();
            }else{//没有url，取静态zNodes参数
                that.createTree(that.zNodes||[]);
            }
        },
        afterUpdate:function(){},
        getCheckRow: function() {
        	var treeId=this.id;
        	var treeObj = $.fn.zTree.getZTreeObj(treeId);
			var nodes = treeObj.getSelectedNodes()||[];
			return nodes;
        },
        expandAll: function() {
        	var treeId=this.id;
        	var treeObj = $.fn.zTree.getZTreeObj(treeId);
			treeObj.expandAll(true);
        },
        foldAll: function() {
        	var treeId=this.id;
        	var treeObj = $.fn.zTree.getZTreeObj(treeId);
			treeObj.expandAll(false);
        }
    };
    return TreeTable;
});