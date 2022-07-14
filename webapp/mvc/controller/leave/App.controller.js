sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Client,
    ServiceNames,
    UI5Error,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.leave.App', {
      TABLE_ID: 'leaveTable',
      CHART_LEAVE_ID: 'LeaveMonthlyChart',
      PERSONAL_DIALOG_ID: 'sap.ui.yesco.mvc.view.leave.fragment.PersonalDialog',
      PERSONAL_TABLE_ID: 'leaveByPersonalTable',

      CHARTS: {
        ACC: { color: '#dc3545', label: 'LABEL_16018', prop: 'Cumuse', propPerc: 'Cumrte' },
        CUR: { color: '#2972c8', label: 'LABEL_16020', prop: 'Monuse', propPerc: 'Monrte' },
      },

      sRouteName: '',

      initializeModel() {
        return {
          busy: false,
          search: {
            Datum: moment().hours(9).toDate(),
            Werks: '',
            Orgeh: '',
            Qtaty: '',
          },
          entry: {
            department: [],
            leaveType: [],
          },
          summary: {
            chart: FusionCharts.curryChartOptions({
              showSum: 1,
              divLineDashed: 0,
              divLineColor: '#eeeeee',
              maxColWidth: 25,
              staggerLines: 2,
              drawCustomLegendIcon: 1,
              legendIconSides: 0,
              chartTopMargin: 10,
              chartLeftMargin: 10,
              plottooltext: "<div class='fusion-tooltip'><table><tr><th>$seriesname-$label</th><td>$value</td></tr></table></div>",
            }),
            categories: [{ category: [] }],
            dataset: [],
          },
          listInfo: {
            rowCount: 2,
          },
          list: [],
          dialog: {
            busy: false,
            rowCount: 1,
            list: [],
          },
        };
      },

      onBeforeShow() {
        this.TableUtils.adjustRowSpan({
          oTable: this.byId(this.TABLE_ID),
          aColIndices: [0, 1, 2, 3, 4],
          sTheadOrTbody: 'thead',
        });
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oViewModel = this.getViewModel();

        this.sRouteName = sRouteName;
        oViewModel.setData(this.initializeModel());

        try {
          oViewModel.setProperty('/busy', true);

          const mAppointeeData = this.getAppointeeData();
          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const [aPersaEntry, aOrgehEntry, aLeaveType] = await Promise.all([
            Client.getEntitySet(oCommonModel, 'PersAreaList', { Pernr: mAppointeeData.Pernr }), //
            Client.getEntitySet(oCommonModel, 'DashboardOrgList', { Werks: mAppointeeData.Werks, Pernr: mAppointeeData.Pernr }),
            Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'QtatyCodeList'),
          ]);

          oViewModel.setProperty('/entry/Werks', aPersaEntry);
          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/entry/leaveType', aLeaveType ?? []);

          const sQtaty = _.get(aLeaveType, [0, 'Zcode'], _.noop());
          const sOrgeh = _.some(aOrgehEntry, (o) => o.Orgeh === mAppointeeData.Orgeh) ? mAppointeeData.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']);

          oViewModel.setProperty('/search/Qtaty', sQtaty);
          oViewModel.setProperty('/search/Werks', mAppointeeData.Werks);
          oViewModel.setProperty('/search/Orgeh', sOrgeh);

          if (!_.isEmpty(sOrgeh) && !_.isEmpty(sQtaty)) this.onPressSearch();
        } catch (oError) {
          this.debug('Controller > leave App > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, aRowData }) {
        const oTable = this.byId(this.TABLE_ID);

        oViewModel.setProperty('/list', aRowData);
        oViewModel.setProperty('/listInfo/rowCount', _.size(aRowData));

        setTimeout(() => {
          this.TableUtils.setColorColumn({ oTable, bHasSumRow: true, mColorMap: { 7: 'bgType02', 13: 'bgType02' } });
        }, 100);
      },

      async openPersonalDialog() {
        const oView = this.getView();

        if (!this.pPersonalDialog) {
          this.pPersonalDialog = await Fragment.load({
            id: oView.getId(),
            name: this.PERSONAL_DIALOG_ID,
            controller: this,
          });

          oView.addDependent(this.pPersonalDialog);

          this.TableUtils.adjustRowSpan({
            oTable: this.byId(this.PERSONAL_TABLE_ID),
            aColIndices: [0, 1, 2, 3, 4, 5, 6, 7],
            sTheadOrTbody: 'thead',
          });
        }

        this.pPersonalDialog.open();
      },

      buildChart() {
        const oChart = FusionCharts(`${this.sRouteName}-${this.CHART_LEAVE_ID}`);
        const mDataSource = this.getViewModel().getProperty('/summary');

        if (!oChart) {
          FusionCharts.ready(() => {
            FusionCharts.getInstance({
              id: `${this.sRouteName}-${this.CHART_LEAVE_ID}`,
              type: 'mscombi2d',
              renderAt: `chart-${this.sRouteName}-container`,
              width: '100%',
              height: '100%',
              dataFormat: 'json',
              dataSource: mDataSource,
            }).render();
          });
        } else {
          oChart.setChartData(mDataSource);
          oChart.render();
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onChangeWerks() {
        const oViewModel = this.getViewModel();

        try {
          const mAppointeeData = this.getAppointeeData();
          const aOrgehEntry = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'DashboardOrgList', {
            Werks: oViewModel.getProperty('/search/Werks'),
            Pernr: mAppointeeData.Pernr,
          });

          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/search/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointeeData.Orgeh) ? mAppointeeData.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));
        } catch (oError) {
          this.debug('Controller > leave App > onChangeWerks Error', oError);

          AppUtils.handleError(oError);
        }
      },

      async onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const mFilters = oViewModel.getProperty('/search');

          _.set(mFilters, 'Datum', this.DateUtils.parse(mFilters.Datum));

          const fCurried = Client.getEntitySet(this.getModel(ServiceNames.WORKTIME));
          const [aSummary, aRowData] = await Promise.all([
            fCurried('LeaveUseHistory', { ...mFilters }), //
            fCurried('LeaveUseBoard', { ...mFilters }),
          ]);

          this.setTableData({ oViewModel, aRowData });

          const mGroupByOyymm = _.chain(aSummary)
            .groupBy('Oyymm')
            .defaults({ ..._.times(12, (v) => ({ [`${this.getBundleText('LABEL_16019', v + 1)}`]: [{ [this.CHARTS.ACC.prop]: 0, [this.CHARTS.CUR.prop]: 0 }] })).reduce((acc, cur) => ({ ...acc, ...cur }), {}) })
            .value();

          const iCurrentMonthIndex = moment(mFilters.Zyymm).month() + 1;
          const mVerticalLineMonth = {
            vline: 'true',
            lineposition: 0,
            color: '#6baa01',
            labelHAlign: 'center',
            labelPosition: 0,
            // label: 'Selected Month',
            dashed: 1,
          };

          oViewModel.setProperty(
            '/summary/categories/0/category',
            _.chain(aSummary)
              .reduce((acc, cur) => [...acc, { label: cur.Oyymm }], [])
              .defaults(_.times(12, (v) => ({ label: this.getBundleText('LABEL_16019', v + 1) })))
              .tap((arr) => arr.splice(iCurrentMonthIndex, 0, mVerticalLineMonth))
              .value()
          );
          oViewModel.setProperty('/summary/dataset', [
            {
              seriesname: this.getBundleText(this.CHARTS.CUR.label),
              showValues: 1,
              color: '#7BB4EB',
              data: _.map(mGroupByOyymm, (v) => ({ value: _.get(v, [0, this.CHARTS.CUR.propPerc], 0) })),
            },
            {
              seriesname: this.getBundleText(this.CHARTS.ACC.label),
              renderAs: 'line',
              color: '#FFAC4B',
              data: _.chain(mGroupByOyymm)
                .map((v) => ({ value: _.get(v, [0, this.CHARTS.ACC.propPerc]) }))
                .forEach((v, i, o) => {
                  if (_.isEqual(v.value, 0)) v.value = _.get(o, [i - 1, 'value'], 0);
                })
                .value(),
            },
          ]);

          this.buildChart();
        } catch (oError) {
          this.debug('Controller > leave App > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onPressPersonalDialogClose() {
        this.pPersonalDialog.close();
        this.pPersonalDialog.destroy();
        this.pPersonalDialog = null;
      },

      onPressDialogRowEname(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();
        const sPernr = mRowData.Pernr;
        const dDatum = moment(mRowData.Datum);

        if (!sPernr) return;

        window.open(`${sHost}#/individualWorkStateView/${sPernr}/${dDatum.year()}/${dDatum.month()}`, '_blank', 'width=1400,height=800');
      },

      onDetailTableSort(oEvent) {
        const oViewModel = this.getViewModel();
        const aDialogList = oViewModel.getProperty('/dialog/list');
        const sSortOrder = oEvent.getParameter('sortOrder'); // "Descending", "Ascending"
        const sSortProperty = oEvent.getParameter('column').getProperty('sortProperty');

        _.chain(aDialogList)
          .find({ Orgeh: '99999999' })
          .set(sSortProperty, sSortOrder === 'Descending' ? 0 : 'Z')
          .commit();

        oViewModel.refresh(true);
      },

      onDetailTableFilter(oEvent) {
        const oViewModel = this.getViewModel();
        const aDialogList = oViewModel.getProperty('/dialog/list');
        const sFilterValue = oEvent.getParameter('value');
        const sFilterProperty = oEvent.getParameter('column').getProperty('filterProperty');

        _.chain(aDialogList).find({ Orgeh: '99999999' }).set(sFilterProperty, sFilterValue).commit();

        oViewModel.refresh(true);
      },

      async onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/dialog/busy', true);

          const mSearch = oViewModel.getProperty('/search');
          const mRowData = oEvent.getParameter('rowBindingContext').getObject();

          const aDetailRow = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'LeaveUseDetail', {
            ..._.omit(mSearch, 'Orgeh'),
            Orgeh: mRowData.Orgeh,
          });

          if (_.isEmpty(aDetailRow)) throw new UI5Error({ message: this.getBundleText('MSG_00034') }); // 조회할 수 없습니다.

          oViewModel.setProperty('/dialog/rowCount', Math.min(11, aDetailRow.length || 1));
          oViewModel.setProperty(
            '/dialog/list',
            _.map(aDetailRow, (o, i) => ({
              ...o,
              Idx: i + 1 < _.size(aDetailRow) ? i + 1 : '',
              OrgtxSort: o.Orgtx,
              OrgtxFilter: o.Orgtx,
              EnameSort: o.Ename,
              EnameFilter: o.Ename,
              ZzjikgbtSort: o.Zzjikgbt,
              ZzjikgbtFilter: o.Zzjikgbt,
              ZzjikchtSort: o.Zzjikcht,
              ZzjikchtFilter: o.Zzjikcht,
              CrecntSort: o.Crecnt === '0.0' ? '0.01' : o.Crecnt,
              CrecntFilter: o.Crecnt,
              Usecnt1Sort: o.Usecnt1 === '0.0' ? '0.01' : o.Usecnt1,
              Usecnt1Filter: o.Usecnt1,
              Userte1Sort: o.Userte1 === '0.0' ? '0.01' : o.Userte1,
              Userte1Filter: o.Userte1,
              Usecnt2Sort: o.Usecnt2 === '0.0' ? '0.01' : o.Usecnt2,
              Usecnt2Filter: o.Usecnt2,
              Userte2Sort: o.Userte2 === '0.0' ? '0.01' : o.Userte2,
              Userte2Filter: o.Userte2,
            }))
          );

          this.openPersonalDialog();
        } catch (oError) {
          this.debug('Controller > leave App > onSelectRow Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/dialog/busy', false);
        }
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.TABLE_ID);
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_16021'); // {휴가부서별현황}_목록

        this.TableUtils.export({ oTable, sFileName });
      },

      onPressPersonalExcelDownload() {
        const oTable = this.byId(this.PERSONAL_TABLE_ID);
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_16029'); // {개인별휴가사용현황}_목록

        this.TableUtils.export({ oTable, sFileName });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
