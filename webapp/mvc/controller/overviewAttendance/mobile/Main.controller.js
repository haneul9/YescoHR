sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/mobile/MobileEmployeeListPopoverHandler',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/overviewAttendance/constants/ChartsSetting',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Decimal',
    'sap/ui/yesco/mvc/model/type/Percent',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    TableUtils,
    MobileEmployeeListPopoverHandler,
    Client,
    ServiceNames,
    BaseController,
    ChartsSetting
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.overviewAttendance.mobile.Main', {
      initializeModel() {
        return {
          busy: false,
          searchConditions: {
            Datum: moment().hours(9).toDate(),
            Werks: '',
            Orgeh: '',
          },
          entry: {
            Werks: [],
            Orgeh: [],
          },
          contents: {
            A01: { busy: false, Headty: '', data: {} },
            A02: { busy: false, Headty: '', data: {} },
            A03: { busy: false, Headty: '', data: {} },
            A04: { busy: false, Headty: '', data: {} },
            A05: { busy: false, Headty: '' },
            A06: { busy: false, Headty: '' },
            // A07: { busy: false, Headty: '' },
            A08: { busy: false, Headty: '', data: {} },
            A09: { busy: false, Headty: '', data: {} },
            // A10: { busy: false, Headty: '' },
          },
          dialog: {
            busy: false,
            rowCount: 0,
            param: {},
            list: [],
            sub: { list: [] },
          },
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          this.setAllBusy(true);

          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const mAppointee = this.getAppointeeData();
          const [aPersaEntry, aOrgehEntry] = await Promise.all([
            Client.getEntitySet(oCommonModel, 'WerksList', { Pernr: mAppointee.Pernr }), //
            Client.getEntitySet(oCommonModel, 'DashboardOrgList', { Werks: mAppointee.Werks, Pernr: mAppointee.Pernr }),
          ]);

          oViewModel.setProperty('/entry/Werks', aPersaEntry);
          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/searchConditions/Werks', mAppointee.Werks);
          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const mFilters = oViewModel.getProperty('/searchConditions');

          _.forEach(_.take(ChartsSetting.CHART_TYPE, 8), (o) => setTimeout(() => this.buildChart(oModel, mFilters, o), 0));

          if (this.bMobile) {
            this.oPopupHandler = new MobileEmployeeListPopoverHandler(this);
          }
        } catch (oError) {
          this.debug('Controller > mobile/m/overviewAttendance Main > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        }
      },

      setAllBusy(bBusy) {
        const oViewModel = this.getViewModel();

        _.times(8).forEach((idx) => oViewModel.setProperty(`/contents/A${_.padStart(++idx, 2, '0')}/busy`, bBusy));
      },

      async buildChart(oModel, mFilters, mChartInfo) {
        const oViewModel = this.getViewModel();
        const aChartDatas = await Client.getEntitySet(oModel, 'TimeOverview', { ...mFilters, Headty: mChartInfo.Headty });
        const vDataObject = oViewModel.getProperty(`/contents/${mChartInfo.Target}/data`);
        const mChartSetting = _.chain(ChartsSetting.CHART_OPTIONS).get(mChartInfo.Chart).cloneDeep().value();

        oViewModel.setProperty(`/contents/${mChartInfo.Target}/Headty`, mChartInfo.Headty);
        oViewModel.setProperty(`/contents/${mChartInfo.Target}/busy`, false);

        if (_.has(mChartInfo, 'Fields')) {
          oViewModel.setProperty(
            `/contents/${mChartInfo.Target}/data`,
            _.chain(vDataObject)
              .tap((obj) => _.forEach(mChartInfo.Fields, (o) => _.set(obj, o.prop, _.get(aChartDatas, o.path))))
              .value()
          );
        }

        switch (mChartInfo.Chart) {
          case 'cylinder':
            _.chain(mChartSetting)
              .set(['chart', 'caption'], this.getBundleText('LABEL_01130'))
              .set('value', _.chain(aChartDatas).get([0, 'Rte01']).toNumber().value())
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'column2d':
            _.chain(mChartSetting)
              .set(
                ['data'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt, value: o.Cnt01, color: '#7BB4EB', link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod01}` }))
              )
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'bar2d':
            _.chain(mChartSetting)
              .set(
                ['data'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt, value: o.Cnt01, color: '#7BB4EB', link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod01}` }))
              )
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'mscombi2d':
            _.chain(mChartSetting)
              .set(
                ['categories', 0, 'category', 0],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt }))
              )
              .set(['dataset', 0], {
                seriesName: this.getBundleText('LABEL_28048'), // 당일
                showValues: '1',
                color: '#7BB4EB',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt01, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod01}` })),
              })
              .set(['dataset', 1], {
                seriesName: this.getBundleText('LABEL_00196'), // 누적
                renderAs: 'line',
                color: '#FFAC4B',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt02, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod02}` })),
              })
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'mscolumn2d':
            _.chain(mChartSetting)
              .set(
                ['categories', 0, 'category', 0],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt }))
              )
              .set(['dataset', 0], {
                seriesname: this.getBundleText('LABEL_32004'), // 법정
                color: '#7BB4EB',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt01, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod01}` })),
              })
              .set(['dataset', 1], {
                seriesname: 'OT',
                color: '#FFAC4B',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt02, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod02}` })),
              })
              .set(['dataset', 2], {
                seriesname: this.getBundleText('LABEL_32005'), // 초과인원
                color: '#FFE479',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt03, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod03}` })),
              })
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          default:
            break;
        }
      },

      callFusionChart(mChartInfo, mChartSetting) {
        if (_.isEmpty(mChartSetting)) return;

        const sChartId = `attendance-${_.toLower(mChartInfo.Target)}-chart`;

        if (!FusionCharts(sChartId)) {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: sChartId,
              type: _.replace(mChartInfo.Chart, '-S', ''),
              renderAt: `${sChartId}-container`,
              width: _.has(mChartInfo, 'ChartWidth') ? mChartInfo.ChartWidth : '100%',
              height: '100%',
              dataFormat: 'json',
              dataSource: mChartSetting,
            }).render();

            FusionCharts.addEventListener('rendered', function () {
              if (mChartInfo.Target === 'A06' || mChartInfo.Target === 'A03') {
                $(`#employeeOnOff-${_.toLower(mChartInfo.Target)}-chart g[class$="-parentgroup"] > g[class$="-sumlabels"] > g[class$="-sumlabels"] > text`).each(function (idx) {
                  $(this)
                    .off('click')
                    .on('click', function () {
                      const oController = sap.ui.getCore().byId('container-ehr---m_overviewAttendance').getController();
                      const oViewModel = oController.getViewModel();
                      const sHeadty = oViewModel.getProperty(`/contents/${mChartInfo.Target}/data/headty`);
                      const sDisyear = oViewModel.getProperty(`/contents/${mChartInfo.Target}/data/raw/${idx}/Ttltxt`);
                      const mPayload = _.zipObject(['Headty', 'Discod', 'Disyear'], [sHeadty, 'all', sDisyear]);

                      oController.callDetail(mPayload);
                    })
                    .addClass('active-link');
                });
              }
            });
          });
        } else {
          const oChart = FusionCharts(sChartId);

          oChart.setChartData(mChartSetting, 'json');
          setTimeout(() => oChart.render(), 200);
        }
      },

      formatDetailRowHighlight(sValue) {
        switch (_.toNumber(sValue)) {
          case 1:
            return sap.ui.core.IndicationColor.Indication03;
          case 2:
            return sap.ui.core.IndicationColor.Indication02;
          case 3:
            return sap.ui.core.IndicationColor.Indication04;
          default:
            return null;
        }
      },

      async openDialog(sHeadty) {
        const oView = this.getView();
        let oDialog = null;

        switch (sHeadty) {
          case 'A':
            if (!this.oDetail1Dialog) {
              this.oDetail1Dialog = await Fragment.load({
                id: oView.getId(),
                name: 'sap.ui.yesco.mvc.view.overviewAttendance.fragment.DialogDetail1',
                controller: this,
              });

              oView.addDependent(this.oDetail1Dialog);
            }

            oDialog = this.oDetail1Dialog;
            this.oDetail1Dialog.open();
            break;
          case 'B':
          case 'C':
          case 'H':
          case 'I':
          case 'J':
            if (!this.oDetail3Dialog) {
              this.oDetail3Dialog = await Fragment.load({
                id: oView.getId(),
                name: 'sap.ui.yesco.mvc.view.overviewAttendance.fragment.DialogDetail3',
                controller: this,
              });

              oView.addDependent(this.oDetail3Dialog);
            }

            oDialog = this.oDetail3Dialog;
            this.oDetail3Dialog.open();
            break;
          case 'D':
          case 'E':
          case 'F':
          case 'G':
            if (!this.oDetail2Dialog) {
              this.oDetail2Dialog = await Fragment.load({
                id: oView.getId(),
                name: 'sap.ui.yesco.mvc.view.overviewAttendance.fragment.DialogDetail2',
                controller: this,
              });

              oView.addDependent(this.oDetail2Dialog);
            }

            oDialog = this.oDetail2Dialog;
            this.oDetail2Dialog.open();
            break;
          case 'X1':
            if (!this.oDetail4Dialog) {
              this.oDetail4Dialog = await Fragment.load({
                id: oView.getId(),
                name: 'sap.ui.yesco.mvc.view.overviewAttendance.fragment.DialogDetail4',
                controller: this,
              });

              oView.addDependent(this.oDetail4Dialog);
            }

            oDialog = this.oDetail4Dialog;
            this.oDetail4Dialog.open();
            break;
          case 'X2':
            if (!this.oDetail5Dialog) {
              this.oDetail5Dialog = await Fragment.load({
                id: oView.getId(),
                name: 'sap.ui.yesco.mvc.view.overviewAttendance.fragment.DialogDetail5',
                controller: this,
              });

              oView.addDependent(this.oDetail5Dialog);
            }

            oDialog = this.oDetail5Dialog;
            this.oDetail5Dialog.open();
            break;
          default:
            break;
        }

        $('#fusioncharts-tooltip-element').hide();

        return oDialog;
      },

      async callDetail(mPayload) {
        const oViewModel = this.getViewModel();
        let oDialog = null;

        oViewModel.setProperty('/dialog/busy', true);

        try {
          oDialog = await this.openDialog(mPayload.Headty);

          const mSearchConditions = oViewModel.getProperty('/searchConditions');
          const sDetailEntity = _.chain(ChartsSetting.CHART_TYPE).find({ Headty: mPayload.Headty }).get('DetailEntity').value();
          const aDetailData = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), sDetailEntity, { ..._.set(mSearchConditions, 'Datum', moment(mSearchConditions.Datum).hours(9).toDate()), ..._.pick(mPayload, ['Headty', 'Discod']) });

          oViewModel.setProperty('/dialog/param', mPayload);
          oViewModel.setProperty('/dialog/rowCount', Math.min(aDetailData.length, 12));
          oViewModel.setProperty('/dialog/totalCount', _.size(aDetailData));
          oViewModel.setProperty(
            '/dialog/list',
            _.map(aDetailData, (o, i) => ({ Idx: ++i, ...o }))
          );
        } catch (oError) {
          this.debug('Controller > mobile/m/overviewAttendance Main > callDetail Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => oDialog.close(),
          });
        } finally {
          oViewModel.setProperty('/dialog/busy', false);
          setTimeout(() => oDialog.getContent()[1].getItems()[0].setFirstVisibleRow(), 100);
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onChangeWerks() {
        const oViewModel = this.getViewModel();

        try {
          const mAppointee = this.getAppointeeData();
          const aOrgehEntry = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'DashboardOrgList', {
            Werks: oViewModel.getProperty('/searchConditions/Werks'),
            Pernr: mAppointee.Pernr,
          });

          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));
        } catch (oError) {
          this.debug('Controller > mobile/m/overviewAttendance Main > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          this.setAllBusy(true);

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const mFilters = oViewModel.getProperty('/searchConditions');

          _.set(mFilters, 'Datum', moment(mFilters.Datum).hours(9).toDate());

          _.forEach(_.take(ChartsSetting.CHART_TYPE, 8), (o) => setTimeout(() => this.buildChart(oModel, mFilters, o), 0));
        } catch (oError) {
          this.debug('Controller > mobile/m/overviewAttendance Main > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPressCount(oEvent) {
        if (this.bMobile) {
          this.oPopupHandler.openPopover(oEvent);
        } else {
          this.callDetail(oEvent.getSource().data());
        }
      },

      onPressDetail1DialogClose() {
        this.oDetail1Dialog.close();
      },

      onPressDetail2DialogClose() {
        this.oDetail2Dialog.close();
      },

      onPressDetail3DialogClose() {
        this.oDetail3Dialog.close();
      },

      onPressDetail4DialogClose() {
        this.oDetail4Dialog.close();
      },
      onPressDetail5DialogClose() {
        this.oDetail5Dialog.close();
      },

      onPressEmployeeRow(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();
        const sUsrty = this.isMss() ? 'M' : this.isHass() ? 'H' : '';

        window.open(`${sHost}#/employeeView/${mRowData.Pernr}/${sUsrty}`, '_blank', 'width=1400,height=800');
      },

      async onPressEmployee2Row(oEvent) {
        const oViewModel = this.getViewModel();
        let oDialog;

        oViewModel.setProperty('/dialog/busy', true);

        try {
          const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();

          oDialog = await this.openDialog('X2');

          const sDiscod = oViewModel.getProperty('/dialog/param/Discod');
          const sAwart = _.includes(['3', '4'], sDiscod) ? '2010' : '2000';
          const aDetailData = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'TimeOverviewDetail5', { ..._.pick(mRowData, ['Pernr', 'Begda', 'Endda']), Awart: sAwart });

          oViewModel.setProperty('/dialog/sub/rowCount', Math.min(aDetailData.length, 12));
          oViewModel.setProperty('/dialog/sub/totalCount', _.size(aDetailData));
          oViewModel.setProperty(
            '/dialog/sub/list',
            _.map(aDetailData, (o, i) => ({ Idx: ++i, ...o }))
          );
        } catch (oError) {
          this.debug('Controller > mobile/m/overviewAttendance Main > onPressEmployee2Row Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => oDialog.close(),
          });
        } finally {
          oViewModel.setProperty('/dialog/busy', false);
        }
      },

      async onPressEmployee3Row(oEvent) {
        const oViewModel = this.getViewModel();
        let oDialog;

        oViewModel.setProperty('/dialog/busy', true);

        try {
          const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();

          oDialog = await this.openDialog('X1');

          const aDetailData = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'TimeOverviewDetail4', { ..._.pick(mRowData, ['Pernr', 'Begda', 'Endda']) });

          oViewModel.setProperty('/dialog/sub/rowCount', Math.min(aDetailData.length, 12));
          oViewModel.setProperty('/dialog/sub/totalCount', _.size(aDetailData));
          oViewModel.setProperty(
            '/dialog/sub/list',
            _.map(aDetailData, (o, i) => ({ Idx: ++i, ...o }))
          );
        } catch (oError) {
          this.debug('Controller > mobile/m/overviewAttendance Main > onPressEmployee3Row Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => oDialog.close(),
          });
        } finally {
          oViewModel.setProperty('/dialog/busy', false);
        }
      },

      onPressDetailExcelDownload(oEvent) {
        const oTable = oEvent.getSource().getParent().getParent().getParent();
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_28040'); // 근태현황상세

        TableUtils.export({ oTable, sFileName });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);

// eslint-disable-next-line no-unused-vars
function callAttendanceDetail(sArgs) {
  const oController = sap.ui.getCore().byId('container-ehr---mobile_m_overviewAttendance').getController();
  const aProps = ['Headty', 'Discod'];
  const aArgs = _.split(sArgs, ',');
  const mPayload = _.zipObject(_.take(aProps, aArgs.length), aArgs);

  oController.callDetail(mPayload);
}
