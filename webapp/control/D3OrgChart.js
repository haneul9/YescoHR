sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Control',
    'sap/m/FlexAlignItems',
    'sap/m/FlexJustifyContent',
    'sap/ui/yesco/common/AppUtils',
  ],
  function (
    // prettier 방지용 주석
    Control,
    FlexAlignItems,
    FlexJustifyContent,
    AppUtils
  ) {
    'use strict';

    return Control.extend('sap.ui.yesco.control.D3OrgChart', {
      metadata: {
        properties: {
          title: { type: 'String', group: 'Misc', defaultValue: '화상조직도' },
        },
        aggregations: {
          items: { type: 'sap.ui.yesco.control.D3OrgChartItem', multiple: true, singularName: 'item' },
        },
        defaultAggregation: 'items',
      },

      createChart: function () {
        const oChartLayout = new sap.m.VBox({ alignItems: FlexAlignItems.Center, justifyContent: FlexJustifyContent.Center });
        const oChartFlexBox = new sap.m.FlexBox({ width: `${$(document).width()}px`, alignItems: FlexAlignItems.Center });

        this.sParentId = oChartFlexBox.getIdForLabel();
        oChartLayout.addItem(oChartFlexBox);

        return oChartLayout;
      },

      renderer: function (oRm, oControl) {
        const layout = oControl.createChart();

        oRm.write('<div');
        oRm.writeControlData(layout);
        oRm.writeClasses();
        oRm.write('>');
        oRm.renderControl(layout);
        oRm.addClass('verticalAlignment');
        oRm.write('</div>');
      },

      onAfterRendering: function () {
        const mItems = this.getItems();
        let aChartData = [];

        mItems.forEach((item) => {
          aChartData.push({ ...item.mProperties });
        });

        this.oD3Chart = null;
        this.oD3Chart = new d3.OrgChart()
          .container('#' + this.sParentId)
          .svgHeight(window.innerHeight - 10)
          .data(aChartData)
          .layout('left')
          .compact(false)
          // .nodeWidth(() => 250)
          .nodeWidth(() => 270)
          .initialZoom(0.9)
          // .nodeHeight(() => 175)
          .nodeHeight(() => 125)
          .childrenMargin(() => 40)
          .compactMarginBetween(() => 15)
          .compactMarginPair(() => 80)
          .nodeContent(function (o) {
            return `
            <div style="background-color:none;margin-left:1px;height:${o.height}px;border-radius:2px;overflow:visible;">
              <div style="height: ${o.height}px;padding-top:0px;background-color:white;border:1px solid lightgray;">
                <img src="${o.data.Photo}" loading="lazy" style="margin-top:10px;margin-left:10px;width:80px;height:80px;float: left;">
                <div style="margin-top: 10px;margin-left: 100px;">
                  <div style="color:#111672;font-size:14px;font-weight:bold"> ${o.data.Stext} </div>
                  <div style="color:#111672;font-size:16px;font-weight:bold"> ${o.data.Ename} </div>
                  <div style="color:#404040;font-size:14px;margin-top:4px"> ${o.data.Botxt} </div>
                </div>
                <div style="margin-top:30px;margin-left:190px;">
                  <div>${o.data.Pernr}</div>
                </div>
              </div>
            </div>
            `;
          })
          .onNodeClick(function (sNodeId) {
            const sPernr = _.find(this.data, { nodeId: sNodeId }).Pernr;

            if (!sPernr) return;

            AppUtils.getAppComponent().getRouter().navTo('employee', { pernr: sPernr });
          })
          .render();

        // <div style="padding-top:30px;background-color:none;margin-left:1px;height:${o.height}px;border-radius:2px;overflow:visible">
        //       <div style="height:${o.height - 32}px;padding-top:0px;background-color:white;border:1px solid lightgray;">
        //           <img src=" ${o.data.Photo}" style="margin-top:-30px;margin-left:${o.width / 2 - 30}px;border-radius:100px;width:60px;height:60px;" />
        //           <div style="margin-right:10px;margin-top:15px;float:right">${o.data.Pernr}</div>
        //           <div style="margin-top:-30px;background-color:#3AB6E3;height:10px;width:${o.width - 2}px;border-radius:1px"></div>
        //           <div style="padding:20px; padding-top:35px;text-align:center">
        //               <div style="color:#111672;font-size:16px;font-weight:bold"> ${o.data.Stext} </div>
        //               <div style="color:#111672;font-size:16px;font-weight:bold"> ${o.data.Ename} </div>
        //               <div style="color:#404040;font-size:16px;margin-top:4px"> ${o.data.Botxt} </div>
        //           </div>
        //       </div>
        //   </div>
      },
    });
  }
);
