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
          addDiyDom: addDiyDom,
          showLine: false,
      }
  };
  //添加的列
  var tableCel = [
      { "key": "extend1", "width": "200px" },
      { "key": "extend2", "width": "200px" }
  ];
  //构造列
  function createTreeCel(celObj, treeNode) {
      var name = celObj.key;
      var width = celObj.width;
      var text = treeNode[name];
      if (text === undefined) {
          text = name;
      }
      var str = '<span class="ui-cel" style="width:' + width + '">' + text + '</span>';
      return str;
  }

  function addDiyDom(treeId, treeNode) {

      var switchEle = $("#" + treeNode.tId + IDMark_Switch);
      var aEle = $("#" + treeNode.tId + IDMark_A);
      var iconEle = $("#" + treeNode.tId + IDMark_Icon);

      var reg = /.*level(\d+).*/g;
      var level = Number(aEle.attr("class").replace(reg, "$1"));
      var indentStr = '<span class="ui-indent"></span>';
      var indentStrs = '';
      for (var i = 0; i < level; i++) {
          indentStrs += indentStr;
      }

      if (treeNode.id === "title") { //相当于表格的表头
          iconEle.remove();
      }

      //修改展开按钮结构位置
      aEle.prepend(switchEle);
      //修改原来的树控件结构
      aEle.append($('<div class="ui-name">' + indentStrs + '</div>').append(aEle.children()));
      //向树控件添加checkbox
      aEle.prepend('<span class="ui-cel ui-check"><input type="checkbox"></span>');
      //向树控件添加其他列
      for (var i = 0; i < tableCel.length; i++) {
          var node = createTreeCel(tableCel[i], treeNode);
          aEle.append(node);
      }
  }

  $(document).ready(function() {
  	$.ajax({
  		type:"get",
  		url:"zNodes.json",
  		success:function(zNodes){
  			zNodes=zNodes?zNodes:[];
  			$.fn.zTree.init($("#treeDemo"), setting, $.parseJSON(zNodes));
  		},
  		error:function(e){
  			alert(String(e));
  		}
  	});
      
  });
