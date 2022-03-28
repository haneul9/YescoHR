sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Decimal',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Client,
    ServiceNames,
    UI5Error,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.leave.App', {
      TableUtils: TableUtils,
      TABLE_ID: 'leaveTable',
      PERSONAL_DIALOG_ID: 'sap.ui.yesco.mvc.view.leave.fragment.PersonalDialog',
      PERSONAL_TABLE_ID: 'leaveByPersonalTable',

      CHARTS: {
        ACC: { color: '#dc3545', label: 'LABEL_16018', prop: 'Cumuse', propPerc: 'Cumrte' },
        CUR: { color: '#2972c8', label: 'LABEL_16020', prop: 'Monuse', propPerc: 'Monrte' },
      },

      initializeModel() {
        return {
          busy: false,
          search: {
            Zyymm: moment().format('YYYYMM'),
            Orgeh: '',
            Qtaty: '',
          },
          entry: {
            department: [],
            leaveType: [],
          },
          summary: {
            chart: {
              showSum: 1,
              showValues: 1,
              rotateValues: 0,
              placeValuesInside: 0,
              divLineDashed: 0,
              divLineColor: '#eeeeee',
              maxColWidth: 25,
              theme: 'ocean',
              bgColor: 'transparent',
              valueFontSize: 9,
              valueFontColor: '#000000',
              valueBgColor: 'transparent',
              showPlotBorder: 0,
              plotBorderThickness: 3,
              plotBorderColor: '#ffffff',
              drawCustomLegendIcon: 1,
              legendIconSides: 0,
              chartTopMargin: 4,
              chartRightMargin: 0,
              chartBottomMargin: 0,
              chartLeftMargin: 0,
              toolTipBgColor: '#ffffff',
              toolTipColor: '#222222',
              showToolTipShadow: 1,
              plotcolorintooltip: 1,
              plottooltext: "<div class='fusion-tooltip'><table><tr><th>$seriesname-$label</th><td>$value</td></tr></table></div>",
            },
            categories: [{ category: [] }],
            dataset: [],
          },
          listInfo: {
            rowCount: 2,
          },
          list: [],
          dialog: {
            busy: false,
            title: '',
            rowCount: 1,
            list: [],
          },
        };
      },

      onBeforeShow() {
        TableUtils.adjustRowSpan({
          oTable: this.byId(this.TABLE_ID),
          aColIndices: [0, 1],
          sTheadOrTbody: 'thead',
        });
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());

        try {
          oViewModel.setProperty('/busy', true);

          const [aDepartment, aLeaveType] = await Promise.all([
            Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'MssOrgehList', { Pernr: this.getAppointeeProperty('Pernr') }),
            Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'QtatyCodeList'), //
          ]);

          oViewModel.setProperty('/entry/department', aDepartment ?? []);
          oViewModel.setProperty('/entry/leaveType', aLeaveType ?? []);

          const sOrgeh = _.get(aDepartment, [0, 'Orgeh'], _.noop());
          const sQtaty = _.get(aLeaveType, [0, 'Zcode'], _.noop());

          oViewModel.setProperty('/search/Orgeh', sOrgeh);
          oViewModel.setProperty('/search/Qtaty', sQtaty);

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
        const sSumLabel = this.getBundleText('LABEL_00172'); // 합계
        const mSumRow = TableUtils.generateSumRow({
          aTableData: aRowData,
          mSumField: { Orgtx: sSumLabel },
          vCalcProps: ['Empcnt', ..._.times(12, (i) => `Inw${_.padStart(i + 1, 2, '0')}`)],
        });

        oViewModel.setProperty('/list', _.isEmpty(mSumRow) ? [] : [...aRowData, mSumRow]);
        oViewModel.setProperty('/listInfo/rowCount', aRowData.length + 1);

        setTimeout(() => {
          TableUtils.setColorColumn({ oTable, bHasSumRow: true, mColorMap: { 7: 'bgType02', 13: 'bgType02' } });
        }, 100);
      },

      openPersonalDialog() {
        const oView = this.getView();

        if (!this.pPersonalDialog) {
          this.pPersonalDialog = Fragment.load({
            id: oView.getId(),
            name: this.PERSONAL_DIALOG_ID,
            controller: this,
          }).then((oDialog) => {
            oView.addDependent(oDialog);

            TableUtils.adjustRowSpan({
              oTable: this.byId(this.PERSONAL_TABLE_ID),
              aColIndices: [0, 1, 2, 3, 4, 5, 6, 11],
              sTheadOrTbody: 'thead',
            });

            return oDialog;
          });
        }
        this.pPersonalDialog.then((oDialog) => oDialog.open());
      },

      buildChart() {
        const mDataSource = this.getViewModel().getProperty('/summary');

        FusionCharts.ready(function () {
          new FusionCharts({
            type: 'mscombi2d',
            renderAt: 'chart-container',
            width: '100%',
            height: '100%',
            dataFormat: 'json',
            dataSource: mDataSource,
          }).render();
        });
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const mFilters = oViewModel.getProperty('/search');
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
            lineposition: '0',
            color: '#6baa01',
            labelHAlign: 'center',
            labelPosition: '0',
            // label: 'Selected Month',
            dashed: '1',
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
              showValues: '1',
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
        this.pPersonalDialog.then((oDialog) => oDialog.close());
      },

      async onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const oControl = oEvent.getSource();
        const mControlParam = oEvent.getParameters();
        const sFldcd = oControl.getColumns()[mControlParam.columnIndex].data('field');
        const mRowData = oControl.getRows()[mControlParam.rowIndex].getBindingContext().getObject();

        if (mRowData.Sumrow || _.isEmpty(sFldcd)) return;

        try {
          oViewModel.setProperty('/dialog/busy', true);

          const aDetailRow = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'LeaveUseDetail', {
            ..._.pick(mRowData, ['Zyymm', 'Orgeh', 'Qtaty']),
            Fldcd: sFldcd,
          });

          if (_.isEmpty(aDetailRow)) throw new UI5Error({ message: this.getBundleText('MSG_00043') }); // 조회할 수 없습니다.

          const aLeaveType = oViewModel.getProperty('/entry/leaveType');

          oViewModel.setProperty('/dialog/title', _.find(aLeaveType, { Zcode: mRowData.Qtaty }).Ztext ?? '');
          oViewModel.setProperty('/dialog/rowCount', Math.min(6, aDetailRow.length || 1));
          oViewModel.setProperty(
            '/dialog/list',
            _.map(aDetailRow, (o, i) => ({ Idx: i + 1, ...o }))
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
        const oTable = this.byId('leaveTable');
        const aTableData = this.getViewModel().getProperty('/list');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_16021'); // {휴가부서별현황}_목록

        TableUtils.export({ oTable, aTableData, sFileName, bHasMultiLabel: true });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
