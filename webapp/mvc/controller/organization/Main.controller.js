sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/D3OrgChart',
    'sap/ui/yesco/control/D3OrgChartItem',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    BaseController,
    AppUtils,
    Client,
    ServiceNames,
    D3OrgChart,
    D3OrgChartItem
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.organization.Main', {
      LAYOUT: { top: 'left', left: 'top' },

      async onBeforeShow() {
        this.chartHolder = this.byId('ChartHolder');
        this.chartHolder.setBusy(true);
        this.chartHolder.removeAllItems();
        this.oD3Chart = null;
      },

      async onObjectMatched() {
        try {
          let aThirdLevelNodeIds = [];

          if (_.isEmpty(this.getViewModel())) {
            const fCurriedPA = Client.getEntitySet(this.getModel(ServiceNames.PA));
            const mAppointee = this.getAppointeeData();
            const [aWerks, [{ Auth }], aOrgLevel, aReturnData] = await Promise.all([
              Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'WerksList', { Pernr: mAppointee.Pernr }), //
              Client.getEntitySet(this.getModel(ServiceNames.TALENT), 'SuccessionAuth'), // 승계 정보 조회 권한
              fCurriedPA('Orglevel'),
              fCurriedPA('EmployeeOrgTree', {
                Menid: this.getCurrentMenuId(),
                Werks: mAppointee.Werks,
                Stdat: moment().hour(9).toDate(),
              }),
            ]);

            setTimeout(() => {
              if (Auth === 'X') {
                const oCompactButton = this.byId('compactButton');
                const oHBox = oCompactButton.getParent();
                const oSuccessionButton = new sap.m.Button({
                  type: 'Emphasized',
                  width: '175px',
                  text: '{= ${/successionOn} ? ${i18n>LABEL_12007} : ${i18n>LABEL_12006} }', // Succession Off : Succession On
                  press: this.onPressSuccessionBtn.bind(this),
                });
                oHBox.insertItem(oSuccessionButton, oHBox.indexOfItem(oCompactButton) + 1);
              }
            });

            const oViewModel = new JSONModel({
              extendNode: '',
              layout: 'top',
              compact: false,
              successionOn: false,
              orgLevel: aOrgLevel ?? [],
              orgList: this.getOrgList(aReturnData),
              entry: {
                Werks: _.map(aWerks, (o) => _.omit(o, '__metadata')),
              },
              search: { Werks: mAppointee.Werks },
            });
            oViewModel.setSizeLimit(1000);
            this.setViewModel(oViewModel);

            if (mAppointee.Werks === '1000') {
              aThirdLevelNodeIds = _.chain(aReturnData)
                .filter({ Upobjid: _.chain(aReturnData).find({ Upobjid: '' }).get('Objid').value() })
                .map((o) => {
                  return _.chain(aReturnData).filter({ Upobjid: o.Objid }).head().get('Objid').value();
                })
                .value();
            }
          }

          const oViewModel = this.getViewModel();
          const sExtendNode = oViewModel.getProperty('/extendNode') || _.noop();
          this.oD3Chart = new D3OrgChart({
            extendNode: sExtendNode,
            items: this.getChartItems(),
          });

          this.chartHolder.addItem(this.oD3Chart);

          const bSuccessionOn = oViewModel.getProperty('/successionOn');
          const bCompact = oViewModel.getProperty('/compact');
          const sLayout = oViewModel.getProperty('/layout') || 'top';

          setTimeout(
            () =>
              this.oD3Chart
                .getChart()
                .layout(sLayout)
                .compact(bCompact)
                .nodeHeight(() => (bSuccessionOn ? 328 : 178))
                .render()
                .fit(),
            200
          );

          if (!_.isEmpty(aThirdLevelNodeIds)) {
            setTimeout(() => {
              const oChartControl = this.oD3Chart.getChart();

              aThirdLevelNodeIds.forEach((d) => oChartControl.setExpanded(d));

              oChartControl.render().fit();
            }, 300);
          }
        } catch (oError) {
          this.debug('Controller > organization Main > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.chartHolder.setBusy(false);
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onPressSwapBtn() {
        const oViewModel = this.getViewModel();
        const oChart = this.oD3Chart.getChart();
        const sLayout = this.LAYOUT[oChart.layout()];

        oViewModel.setProperty('/layout', sLayout);
        oChart.layout(sLayout).render().fit();
      },

      onPressCompactBtn() {
        const oViewModel = this.getViewModel();
        const oChart = this.oD3Chart.getChart();
        const bCompact = oChart.compact();

        oViewModel.setProperty('/compact', !bCompact);
        oChart.compact(!bCompact).render().fit();
      },

      onPressSuccessionBtn() {
        const oViewModel = this.getViewModel();
        const oChart = this.oD3Chart.getChart();
        const bSuccessionOn = !oViewModel.getProperty('/successionOn');

        oViewModel.setProperty('/successionOn', bSuccessionOn);
        oChart.nodeHeight(() => (bSuccessionOn ? 328 : 178)).render();
      },

      async onChangeWerks() {
        const oViewModel = this.getViewModel();

        try {
          this.chartHolder.setBusy(true);
          this.chartHolder.removeAllItems();

          const sWerks = oViewModel.getProperty('/search/Werks');
          const aReturnData = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'EmployeeOrgTree', {
            Menid: this.getCurrentMenuId(),
            Werks: sWerks,
            Stdat: moment().hour(9).toDate(),
          });

          if (_.isEmpty(aReturnData)) {
            oViewModel.setProperty('/orgList', []);
            return;
          }

          oViewModel.setProperty('/orgList', this.getOrgList(aReturnData));

          const sLayout = oViewModel.getProperty('/layout');
          const bCompact = oViewModel.getProperty('/compact');

          this.oD3Chart = new D3OrgChart({
            extendNode: null,
            layout: sLayout,
            compact: bCompact,
            items: this.getChartItems(),
          });

          this.chartHolder.addItem(this.oD3Chart);

          if (sWerks === '1000') {
            const aThirdLevelNodeIds = _.chain(aReturnData)
              .filter({ Upobjid: _.chain(aReturnData).find({ Upobjid: '' }).get('Objid').value() })
              .map((o) => {
                return _.chain(aReturnData).filter({ Upobjid: o.Objid }).head().get('Objid').value();
              })
              .value();

            setTimeout(() => {
              const oChartControl = this.oD3Chart.getChart();

              aThirdLevelNodeIds.forEach((d) => oChartControl.setExpanded(d));

              oChartControl.render().fit();
            }, 200);
          }
        } catch (oError) {
          this.debug('Controller > Organization > onChangeWerks Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.chartHolder.setBusy(false);
        }
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/

      getOrgList(aReturnData) {
        const sUnknownAvatarImageURL = this.getUnknownAvatarImageURL();
        return _.map(aReturnData, (o) => ({
          ...o,
          Photo: _.isEmpty(o.Photo) ? sUnknownAvatarImageURL : o.Photo,
          Ipdat: _.isDate(o.Ipdat) ? moment(o.Ipdat).format('YYYY.MM.DD') : '',
          JikgbtlLabel: this.getBundleText('LABEL_00215'), // 직급
          IpdatLabel: this.getBundleText('LABEL_00235'), // 입사일
          TenureLabel: this.getBundleText('LABEL_12101'), // 현부서 재임기간
          ScsplnLabel: this.getBundleText('LABEL_12102'), // 승계 계획(차년도)
          ScspntLabel: this.getBundleText('LABEL_12103'), // 승계 예정시점
          Cand1stLabel: this.getBundleText('LABEL_12104'), // 승계 후보자(1순위)
          CandpntLabel: this.getBundleText('LABEL_12105'), // 승계 가능시점
        }));
      },

      getChartItems() {
        return {
          path: '/orgList',
          template: new D3OrgChartItem({
            nodeId: '{Objid}',
            parentNodeId: '{Upobjid}',
            Stdat: '{Stdat}',
            Stext: '{Stext}',
            Pernr: '{Pernr}',
            Ename: '{Ename}',
            IpdatLabel: '{IpdatLabel}',
            Ipdat: '{Ipdat}',
            Photo: '{Photo}',
            Botxt: '{Botxt}',
            JikgbtlLabel: '{JikgbtlLabel}',
            Jikgbtl: '{Jikgbtl}',
            ZorgLevl: '{ZorgLevl}',
            TenureLabel: '{TenureLabel}',
            Tenure: '{Tenure}',
            ScsplnLabel: '{ScsplnLabel}', // 승계 계획(차년도)
            Scspln: '{Scspln}',
            ScspntLabel: '{ScspntLabel}', // 승계 예정시점
            Scspnt: '{Scspnt}',
            Cand1stLabel: '{Cand1stLabel}', // 승계 후보자(1순위)
            Cand1st1: '{Cand1st1}', // 승계후보자(1순위)_성명/직급
            Cand1st2: '{Cand1st2}', // 승계후보자(1순위)_인사영역
            Cand1st3: '{Cand1st3}', // 승계후보자(1순위)_포지션
            CandpntLabel: '{CandpntLabel}', // 승계 가능시점
            Candpnt: '{Candpnt}',
            CpPernr: '{CpPernr}',
            CpPhoto: '{CpPhoto}',
          }),
        };
      },
    });
  }
);
