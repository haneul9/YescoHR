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
          layout: { type: 'String', group: 'Misc', defaultValue: 'top' },
        },
        aggregations: {
          items: { type: 'sap.ui.yesco.control.D3OrgChartItem', multiple: true, singularName: 'item' },
        },
        defaultAggregation: 'items',
      },

      createChart: function () {
        const oChartLayout = new sap.m.VBox({ height: '100%', alignItems: FlexAlignItems.Center, justifyContent: FlexJustifyContent.Center });
        const oChartFlexBox = new sap.m.FlexBox({ width: `${$(document).width()}px`, height: '100%', alignItems: FlexAlignItems.Center });

        this.sParentId = oChartFlexBox.getIdForLabel();
        oChartLayout.addItem(oChartFlexBox);

        return oChartLayout;
      },

      getChart: function () {
        return this.oD3Chart;
      },

      renderer: function (oRm, oControl) {
        const layout = oControl.createChart();

        oRm.write('<div');
        oRm.write(' style="height: 100%;"');
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
          .layout(this.getLayout())
          .compact(false)
          .setActiveNodeCentered(true)
          .nodeWidth(() => 350)
          .initialZoom(0.8)
          .nodeHeight(() => 170)
          .childrenMargin(() => 40)
          .compactMarginBetween(() => 15)
          .compactMarginPair(() => 80)
          .linkUpdate(function (d) {
            d3.select(this)
              .attr('stroke', (d) => (d.data._upToTheRootHighlighted ? '#c6c6c6' : '#c6c6c6'))
              .attr('stroke-width', (d) => (d.data._upToTheRootHighlighted ? 3 : 1));

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
            const oDesktop = sap.ui.getCore().byId('container-ehr---m_organization--ChartHolder');
            const oMobile = sap.ui.getCore().byId('container-ehr---mobile_m_organization--ChartHolder');
            const oViewModel = oDesktop ? oDesktop.getModel() : oMobile.getModel();
            const sPernr = _.find(this.data, { nodeId: sNodeId }).Pernr;
            const aRoutePath = oDesktop ? ['employee', 'employee'] : ['mobile/employee', 'mobile/m/employee-org'];

            oViewModel.setProperty('/extendNode', sNodeId);

            if (!sPernr) {
              if ([...event.srcElement.classList].includes('title')) {
                AppUtils.getAppComponent()
                  .getRouter()
                  .navTo(aRoutePath[1], { pernr: 'NA', orgeh: sNodeId, orgtx: _.replace(event.srcElement.textContent, /\//g, '--') });
              }
            } else {
              if ([...event.srcElement.classList].includes('title')) {
                AppUtils.getAppComponent()
                  .getRouter()
                  .navTo(aRoutePath[1], { pernr: sPernr, orgeh: sNodeId, orgtx: _.replace(event.srcElement.textContent, /\//g, '--') });
              } else {
                AppUtils.getAppComponent().getRouter().navTo(aRoutePath[0], { pernr: sPernr });
              }
            }
          })
          .render()
          .fit();

        if (!_.isEmpty(this.getExtendNode())) {
          this.oD3Chart.setExpanded(this.getExtendNode()).setCentered(this.getExtendNode()).render();
          // .setHighlighted(this.getExtendNode())
        }
      },
    });
  }
);
