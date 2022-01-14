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
          extendNode: { type: 'String', group: 'Misc', defaultValue: '' },
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
          .setActiveNodeCentered(false)
          .nodeWidth(() => 350)
          .initialZoom(0.8)
          .nodeHeight(() => 170)
          .childrenMargin(() => 40)
          .compactMarginBetween(() => 15)
          .compactMarginPair(() => 80)
          .linkUpdate(function (d) {
            d3.select(this)
              .attr('stroke', (d) => (d.data._upToTheRootHighlighted ? '#14760D' : '#002a79'))
              .attr('stroke-width', (d) => (d.data._upToTheRootHighlighted ? 15 : 1));

            if (d.data._upToTheRootHighlighted) {
              d3.select(this).raise();
            }
          })
          .nodeContent(function (o) {
            const sJikgbtlLabel = _.isEmpty(o.data.Ename) ? '' : '직급';
            const sIpdatLabel = _.isEmpty(o.data.Ename) ? '' : '입사일';
            const sTenureLabel = _.isEmpty(o.data.Ename) ? '' : '현부서재임기간';

            return `
            <div class="org-container" style="height: ${o.height}px;">
              <div class="title level${o.data.ZorgLevl}">${o.data.Stext}</div>
              <div class="image" style="grid-row: 2 / 6;margin-left: 10px;margin-top: 10px;">
                  <img src="${o.data.Photo}" loading="lazy" />
              </div>
              <div class="name">${o.data.Ename}</div>
              <div class="label">${sJikgbtlLabel}</div>
              <div class="content">${o.data.Jikgbtl}</div>
              <div class="label">${sIpdatLabel}</div>
              <div class="content">${o.data.Ipdat}</div>
              <div class="label">${sTenureLabel}</div>
              <div class="content">${o.data.Tenure}</div>
            </div>
            `;
          })
          .onNodeClick(function (event, sNodeId) {
            const oViewModel = sap.ui.getCore().byId('container-ehr---m_organization--ChartHolder').getModel();
            const sPernr = _.find(this.data, { nodeId: sNodeId }).Pernr;

            if (!sPernr) {
              if ([...event.srcElement.classList].includes('title')) {
                AppUtils.getAppComponent()
                  .getRouter()
                  .navTo('employee', { pernr: 'none', orgtx: _.replace(event.srcElement.textContent, /\//g, '--') });
              }
            } else {
              if ([...event.srcElement.classList].includes('title')) {
                AppUtils.getAppComponent()
                  .getRouter()
                  .navTo('employee', { pernr: sPernr, orgtx: _.replace(event.srcElement.textContent, /\//g, '--') });
              } else {
                AppUtils.getAppComponent().getRouter().navTo('employee', { pernr: sPernr });
              }
            }
            oViewModel.setProperty('/extendNode', sNodeId);
          })
          .render();

        if (!_.isEmpty(this.getExtendNode())) {
          this.oD3Chart.setExpanded(this.getExtendNode()).setHighlighted(this.getExtendNode()).render();
        }
      },
    });
  }
);
