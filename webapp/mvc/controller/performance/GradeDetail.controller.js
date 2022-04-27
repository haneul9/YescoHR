sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/performance/constant/Constants',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    MessageBox,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    UI5Error,
    TableUtils,
    BaseController,
    Constants
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.GradeDetail', {
      initializeModel() {
        return {
          busy: false,
          pageBusy: false,
          isActive: false,
          parameter: {},
          grade: [],
          gradeMap: {},
          gradeEntry: [],
          grids: [],
          summary: {
            ZzapstsNm: '',
            Orgtx2: '',
            ZzappgrTxt: '',
            list: [
              { Zgrade1State: 'None', Zgrade2State: 'None', Zgrade3State: 'None' },
              { Zgrade1State: 'None', Zgrade2State: 'None', Zgrade3State: 'None' },
            ],
          },
          raw: {
            rowCount: 0,
            list: [],
          },
          tab: {
            busy: false,
            selectedKey: 'A',
            sortIndex: 0,
            list: [],
          },
          department: {
            rowCount: 2,
            list: [],
          },
          dialog: {
            busy: true,
            mode: 'A',
            grade: '',
            gradeTx: '',
            list: [],
          },
        };
      },

      /**
       * @override
       */
      onBeforeShow() {
        TableUtils.adjustRowSpan({
          oTable: this.byId('departmentTable'),
          aColIndices: [0],
          sTheadOrTbody: 'thead',
        });
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          const oView = this.getView();
          const oListView = oView.getParent().getPage('container-ehr---m_performanceGrade');

          if (_.isEmpty(oListView) || _.isEmpty(oListView.getModel().getProperty('/parameter/rowData'))) {
            throw new UI5Error({ code: 'E', message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
          }

          const mParameter = _.chain(oListView.getModel().getProperty('/parameter/rowData')).cloneDeep().omit('__metadata').value();
          const mDetailData = await Client.deep(this.getModel(ServiceNames.APPRAISAL), 'Appraisal2GDoc', {
            Menid: this.getCurrentMenuId(),
            Prcty: Constants.PROCESS_TYPE.DETAIL.code,
            ..._.pick(mParameter, ['Orgeh2', 'Zapcnt', 'Zzappgr', 'Zzapper', 'Zzappid', 'Zzapsts', 'ZzapstsSub', 'ZzapstsPSub']),
            Appraisal2GDocDetSet: [],
            Appraisal2GGradeSet: [],
          });

          const aGradeRatings = _.chain(mDetailData.Appraisal2GGradeSet.results)
            .head()
            .pickBy((v, p) => _.startsWith(p, 'Rating') && !_.isEqual(v, '0000'))
            .map((v) => ({ code: _.chain(v).toNumber().toString().value() }))
            .value();
          const aGradeErrorLevels = _.chain(mDetailData.Appraisal2GGradeSet.results)
            .last()
            .pickBy((v, p) => _.startsWith(p, 'Zgrade') && !_.isEmpty(v))
            .map((v) => ({ level: v }))
            .value();
          const aGrades = _.chain(mDetailData.Appraisal2GGradeSet.results)
            .head()
            .pickBy((v, p) => _.startsWith(p, 'Zgrade') && !_.isEmpty(v))
            .map((v) => ({ text: v }))
            .map((obj, idx) => ({ ...obj, ..._.get(aGradeRatings, [idx]), ..._.get(aGradeErrorLevels, [idx]) }))
            .value();
          const mGradeMap = _.reduce(aGrades, (acc, cur) => ({ ...acc, [cur.code]: cur.text }), {});

          oViewModel.setProperty('/isActive', !_.isEqual(mParameter.Zonlydsp, 'X') && _.isEqual('42', `${mParameter.Zzapsts}${mParameter.ZzapstsSub}`));
          oViewModel.setProperty('/parameter', mParameter);
          oViewModel.setProperty('/gradeMap', mGradeMap);
          oViewModel.setProperty('/grade', aGrades);
          oViewModel.setProperty('/gradeEntry', new ComboEntry({ codeKey: 'code', valueKey: 'text', aEntries: aGrades }));
          oViewModel.setProperty('/grids', _.concat(aGrades, { code: 'ALL', text: this.getBundleText('LABEL_10075') })); // 미지정

          oViewModel.setProperty('/summary/ZzapstsNm', _.get(mParameter, 'ZzapstsSubnm'));
          oViewModel.setProperty('/summary/Orgtx2', _.get(mParameter, 'Orgtx2'));
          oViewModel.setProperty('/summary/ZzappgrTxt', _.get(mParameter, 'ZzappgrTxt'));
          oViewModel.setProperty('/summary/list', [
            _.chain(mDetailData.Appraisal2GGradeSet.results)
              .nth(1)
              .pickBy((v, p) => (_.startsWith(p, 'Zgrade') && !_.isEmpty(v)) || _.isEqual(p, 'Ztotcnt'))
              .forEach((v, p, o) => {
                o[p] = _.trim(v);
              })
              .set('Label', this.getBundleText('LABEL_10076'))
              .set('Zgrade1State', 'None')
              .set('Zgrade2State', 'None')
              .set('Zgrade3State', 'None')
              .value(),
            { Label: this.getBundleText('LABEL_10077'), Ztotcnt: '0', Zgrade1: '0', Zgrade1State: 'None', Zgrade2: '0', Zgrade2State: 'None', Zgrade3: '0', Zgrade3State: 'None' },
          ]);

          const aRawData = _.map(mDetailData.Appraisal2GDocDetSet.results, (o, i) => ({ Idx: ++i, ..._.omit(o, '__metadata'), Fapp: _.isEmpty(o.Fapp) ? 'ALL' : o.Fapp, FappTx: _.get(mGradeMap, o.Fapp, '') }));

          oViewModel.setProperty('/raw/list', aRawData);
          oViewModel.setProperty('/tab/list', aRawData);
          oViewModel.setProperty('/tab/rowCount', Math.min(_.size(aRawData), 10));

          this.calculateByDepart();
          this.onSort();
        } catch (oError) {
          this.debug(`Controller > m/performanceGrade Grade > onObjectMatched Error`, oError);

          AppUtils.handleError(oError, {
            onClose: () => this.getRouter().navTo('m/performanceGrade'),
          });
        } finally {
          oViewModel.setProperty('/busy', false);

          setTimeout(() => {
            this.setGridFilter();

            TableUtils.setColorColumn({
              oTable: this.byId('summaryTable'),
              bIncludeHeader: true,
              mHeaderColorMap: { 2: 'bgType04', 3: 'bgType05', 4: 'bgType06' },
              mColorMap: { 2: 'bgType07', 3: 'bgType08', 4: 'bgType09' },
            });
          }, 100);
        }
      },

      setGridFilter() {
        const oGridBox = this.byId('gridBox');

        oGridBox.getItems().forEach((box) => {
          var oGridContainer = box.getItems()[1];

          oGridContainer.getBinding('items').filter([new Filter('Fapp', FilterOperator.EQ, oGridContainer.data('Fapp'))]);
        });
      },

      setEmptyCard() {
        const oViewModel = this.getViewModel();
        const aList = oViewModel.getProperty('/tab/list');

        _.remove(aList, (o) => _.isEmpty(o.Ename));

        const mFappCount = _.countBy(aList, 'Fapp');
        const aGrade = oViewModel.getProperty('/grade');
        const aGradeCodes = _.chain(aGrade).map('code').concat(['ALL']).value();

        _.forEach(aGradeCodes, (code) => {
          if (!_.has(mFappCount, code)) aList.push({ Fapp: code, Orgtx: 'EMPTY' });
        });

        oViewModel.setProperty('/tab/list', aList);
      },

      calculateByDepart() {
        const oViewModel = this.getViewModel();
        const aGrades = oViewModel.getProperty('/grade');
        const aRawList = oViewModel.getProperty('/raw/list');
        const iRawTotalCount = _.size(aRawList);
        const aListByDepart = _.chain(aRawList)
          .groupBy('Zzappun1')
          .reduce((acc, cur) => {
            const mFappCount = _.countBy(cur, 'Fapp');
            const sDept01 = _.get(mFappCount, _.get(aGrades, [0, 'code']), 0);
            const sDept03 = _.get(mFappCount, _.get(aGrades, [1, 'code']), 0);
            const sDept05 = _.get(mFappCount, _.get(aGrades, [2, 'code']), 0);
            const sDept07 = _.get(mFappCount, '', 0);
            const sDept09 = _.chain(mFappCount).values().sum().value();

            return [
              ...acc,
              {
                Zzappun1: _.get(cur, [0, 'Zzappun1'], ''),
                Zzappuntx1: _.get(cur, [0, 'Zzappuntx1'], ''),
                Orgeh: _.get(cur, [0, 'Orgeh'], ''),
                Orgtx: _.get(cur, [0, 'Orgtx'], ''),
                Osort: _.get(cur, [0, 'Osort'], ''),
                Dept01: sDept01,
                Dept02: _.chain(sDept01).divide(iRawTotalCount).multiply(100).floor(1).value(),
                Dept03: sDept03,
                Dept04: _.chain(sDept03).divide(iRawTotalCount).multiply(100).floor(1).value(),
                Dept05: sDept05,
                Dept06: _.chain(sDept05).divide(iRawTotalCount).multiply(100).floor(1).value(),
                Dept07: sDept07,
                Dept08: _.chain(sDept07).divide(iRawTotalCount).multiply(100).floor(1).value(),
                Dept09: sDept09,
                Dept10: _.chain(sDept09).divide(iRawTotalCount).multiply(100).floor(1).value(),
              },
            ];
          }, [])
          .orderBy(['Osort'], ['asc'])
          .value();

        const sSumLabel = this.getBundleText('LABEL_00172'); // 합계
        const mSumRow = TableUtils.generateSumRow({
          aTableData: aListByDepart,
          mSumField: { Zzappuntx1: sSumLabel },
          vCalcProps: /^Dept/,
        });

        _.chain(mSumRow)
          .set('Dept02', _.isEqual(_.get(mSumRow, 'Dept01'), iRawTotalCount) ? 100 : _.floor(_.get(mSumRow, 'Dept02'), 1))
          .set('Dept04', _.isEqual(_.get(mSumRow, 'Dept03'), iRawTotalCount) ? 100 : _.floor(_.get(mSumRow, 'Dept04'), 1))
          .set('Dept06', _.isEqual(_.get(mSumRow, 'Dept05'), iRawTotalCount) ? 100 : _.floor(_.get(mSumRow, 'Dept06'), 1))
          .set('Dept08', _.isEqual(_.get(mSumRow, 'Dept07'), iRawTotalCount) ? 100 : _.floor(_.get(mSumRow, 'Dept08'), 1))
          .set('Dept10', _.isEqual(_.get(mSumRow, 'Dept09'), iRawTotalCount) ? 100 : _.floor(_.get(mSumRow, 'Dept10'), 1))
          .commit();

        oViewModel.setProperty('/department/rowCount', _.chain(aListByDepart).size().add(1).value());
        oViewModel.setProperty('/department/list', [...aListByDepart, mSumRow]);

        const [mGradeBase, mGradeSum] = oViewModel.getProperty('/summary/list');
        const sZtotcnt = _.chain(mSumRow).pick(['Dept01', 'Dept03', 'Dept05']).values().sum().value();
        const sZgrade1 = _.get(mSumRow, 'Dept01', 0);
        const sZgrade2 = _.get(mSumRow, 'Dept03', 0);
        const sZgrade3 = _.get(mSumRow, 'Dept05', 0);

        oViewModel.setProperty(
          '/summary/list/1',
          _.chain(mGradeSum)
            .set('Ztotcnt', sZtotcnt)
            .set('Zgrade1', sZgrade1)
            .set('Zgrade1State', !_.eq(_.toNumber(mGradeBase.Zgrade1), 0) && _.gt(sZgrade1, _.toNumber(mGradeBase.Zgrade1)) ? 'Error' : 'None')
            .set('Zgrade2', sZgrade2)
            .set('Zgrade2State', !_.eq(_.toNumber(mGradeBase.Zgrade2), 0) && _.gt(sZgrade2, _.toNumber(mGradeBase.Zgrade2)) ? 'Error' : 'None')
            .set('Zgrade3', sZgrade3)
            .set('Zgrade3State', !_.eq(_.toNumber(mGradeBase.Zgrade3), 0) && _.gt(sZgrade3, _.toNumber(mGradeBase.Zgrade3)) ? 'Error' : 'None')
            .value()
        );
      },

      orderBy(sPath, aProps, aOrders) {
        const oViewModel = this.getViewModel();
        const aList = oViewModel.getProperty(sPath);

        oViewModel.setProperty(
          sPath,
          _.chain(aList)
            .tap((arr) => _.remove(arr, (o) => _.isEmpty(o.Ename)))
            .orderBy(aProps, aOrders)
            .map((o, i) => _.set(o, 'Idx', ++i))
            .value()
        );
      },

      reselectionTable() {
        setTimeout(() => {
          this.oTempTable.clearSelection();
          _.chain(this.oTempTable.getBinding('rows').getContexts())
            .map((ctx) => ctx.getObject())
            .filter((o) => _.isEqual(o.tmpSort, 0))
            .size()
            .tap((cnt) => {
              if (cnt > 0) this.oTempTable.addSelectionInterval(0, --cnt);
            })
            .commit();
        }, 0);
      },

      async createProcess({ code, label }) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/pageBusy', true);

        try {
          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const mParameter = _.cloneDeep(oViewModel.getProperty('/parameter'));
          const aList = _.cloneDeep(oViewModel.getProperty('/raw/list'));
          const bIsSave = _.isEqual(code, Constants.PROCESS_TYPE.SAVE.code);

          await Client.deep(oModel, 'Appraisal2GDoc', {
            Menid: this.getCurrentMenuId(),
            Prcty: code,
            ..._.pick(mParameter, ['Orgeh2', 'Zapcnt', 'Zzappgr', 'Zzapper', 'Zzappid', 'Zzapsts', 'ZzapstsSub', 'ZzapstsPSub']),
            Appraisal2GDocDetSet: _.map(aList, (o) => _.set(o, 'Fapp', _.isEqual(o.Fapp, 'ALL') ? '' : o.Fapp)),
          });

          // {저장|전송|승인|취소}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', label), {
            onClose: () => {
              if (!bIsSave) this.onNavBack();
            },
          });
        } catch (oError) {
          this.debug(`Controller > m/performanceGrade Grade > createProcess Error`, oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/pageBusy', false);
        }
      },

      formatRowHighlight(sValue) {
        switch (_.toNumber(sValue)) {
          case 3:
            return sap.ui.core.IndicationColor.Indication01;
          case 2:
            return sap.ui.core.IndicationColor.Indication02;
          case 1:
            return sap.ui.core.IndicationColor.Indication03;
          default:
            return null;
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/tab/busy', true);

        try {
          const oRowData = oEvent.getSource().getParent().getBindingContext().getObject();
          const aRawData = oViewModel.getProperty('/raw/list');
          const aFilteredData = _.isEmpty(oRowData.Zzappun1) ? aRawData : _.filter(aRawData, (o) => _.isEqual(o.Zzappun1, oRowData.Zzappun1));

          oViewModel.setProperty('/tab/Zzappun1', oRowData.Zzappun1);
          oViewModel.setProperty('/tab/list', aFilteredData);
          oViewModel.setProperty('/tab/rowCount', Math.min(_.size(aFilteredData), 10));

          this.onSort();
        } catch (oError) {
          this.debug(`Controller > m/performanceGrade Grade > onSelectRow Error`, oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/tab/busy', false);
        }
      },

      onChangeFapp(oEvent) {
        const mGradeMap = this.getViewModel().getProperty('/gradeMap');
        const mRowData = oEvent.getSource().getParent().getParent().getBindingContext().getObject();

        _.set(mRowData, 'FappTx', _.get(mGradeMap, mRowData.Fapp, ''));

        this.setEmptyCard();
        this.calculateByDepart();
      },

      onDrop(oInfo) {
        const oViewModel = this.getViewModel();
        const oDragged = oInfo.getParameter('draggedControl');
        const oDropped = oInfo.getParameter('droppedControl');
        const oDraggPath = oDragged.getBindingContext().getPath();
        const mDraggData = oViewModel.getProperty(oDraggPath);

        if (_.isEqual(oDragged, oDropped) || _.isEmpty(mDraggData.Ename)) return;

        const sDroppedFapp = oDropped.getParent().data('Fapp');
        oViewModel.setProperty(`${oDraggPath}/Fapp`, sDroppedFapp);

        this.onSort();
        this.calculateByDepart();
      },

      onSort() {
        const oViewModel = this.getViewModel();
        const iSortIndex = oViewModel.getProperty('/tab/sortIndex');

        oViewModel.setProperty(
          '/tab/list',
          _.map(oViewModel.getProperty('/tab/list'), (o) => _.set(o, 'Fapp', _.isEqual(o.Fapp, 'ALL') ? '' : o.Fapp))
        );

        switch (iSortIndex) {
          case 0:
            this.orderBy('/tab/list', ['Osort', 'Zapgma', 'Fapp', 'Zzjikgb', 'Zzappee'], ['asc', 'desc', 'desc', 'asc', 'asc']);

            break;
          case 1:
            this.orderBy('/tab/list', ['Zapgma', 'Fapp', 'Zzjikgb', 'Zzappee'], ['desc', 'desc', 'asc', 'asc']);

            break;
          case 2:
            this.orderBy('/tab/list', ['Fapp', 'Zapgma', 'Zzjikgb', 'Zzappee'], ['desc', 'desc', 'asc', 'asc']);

            break;
          default:
            break;
        }

        oViewModel.setProperty(
          '/tab/list',
          _.map(oViewModel.getProperty('/tab/list'), (o) => _.set(o, 'Fapp', _.isEqual(o.Fapp, '') ? 'ALL' : o.Fapp))
        );

        this.setEmptyCard();
      },

      async onClickGrade(oEvent) {
        const oView = this.getView();
        const oViewModel = this.getViewModel();
        const mPayload = sap.ui.getCore().byId($(oEvent.currentTarget).attr('id')).data();
        const sDialogMode = _.isEqual(mPayload.grade, 'ALL') ? 'B' : 'A';
        const aRaws = oViewModel.getProperty('/raw/list');
        const mGradeMap = oViewModel.getProperty('/gradeMap');

        oViewModel.setProperty('/dialog', {
          ...mPayload,
          busy: true,
          mode: sDialogMode,
          list: _.chain(aRaws)
            .cloneDeep()
            .map((o) =>
              _.chain(o)
                .set('FappTx', _.get(mGradeMap, o.Fapp, ''))
                .set('Fapp2', _.isEqual(o.Fapp, 'ALL') ? '' : o.Fapp)
                .set('tmpSort', _.isEqual(sDialogMode, 'B') || _.isEqual(o.Fapp, mPayload.grade) ? 0 : 1)
                .value()
            )
            .orderBy(['tmpSort', 'Zapgma', 'Fapp2', 'Zzjikgb', 'Zzappee'], ['asc', 'desc', 'desc', 'asc', 'asc'])
            .value(),
        });

        if (!this.oGradeDialog) {
          this.oGradeDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.performance.fragment.grade.DialogGradeByDepart',
            controller: this,
          });

          this.oGradeDialog.attachAfterOpen(() => {
            const oTableContainer = this.byId('gradeByDepartContainer');
            const sGrade = this.getViewModel().getProperty('/dialog/grade');

            oTableContainer.getItems().forEach((oTable) => {
              setTimeout(() => {
                const aTableRows = oTable.getBinding('rows');

                oTable.clearSelection();

                aTableRows.filter([new Filter('Zzappun1', FilterOperator.EQ, oTable.data('Zzappun1'))]);
                _.chain(aTableRows.getContexts())
                  .map((ctx) => ctx.getObject())
                  .filter((o) => _.isEqual(o.Fapp, sGrade))
                  .size()
                  .tap((cnt) => {
                    if (cnt > 0) oTable.addSelectionInterval(0, --cnt);
                  })
                  .commit();
              }, 0);
            });
          });

          oView.addDependent(this.oGradeDialog);
        }

        this.oGradeDialog.open();

        oViewModel.setProperty('/dialog/busy', false);
      },

      onPressGradeByDepartDialogClose() {
        this.oGradeDialog.close();
      },

      onPressGradeByDepartDialogApply() {
        const oViewModel = this.getViewModel();
        const aDialogList = oViewModel.getProperty('/dialog/list');
        const sMode = oViewModel.getProperty('/dialog/mode');

        if (sMode === 'A') {
          const oTableContainer = this.byId('gradeByDepartContainer');
          const sGrade = oViewModel.getProperty('/dialog/grade');

          _.chain(aDialogList)
            .filter((o) => _.isEqual(o.Fapp, sGrade))
            .forEach((o) => _.set(o, 'Fapp', 'ALL'))
            .commit();

          oViewModel.setProperty('/dialog/list', aDialogList);

          oTableContainer.getItems().forEach((oTable) => {
            const aTableRowContexts = oTable.getBinding('rows').getContexts();
            const aSelectedIndices = oTable.getSelectedIndices();

            aSelectedIndices.forEach((idx) => _.set(aTableRowContexts[idx].getObject(), 'Fapp', sGrade));
          });
        } else {
          aDialogList.forEach((o) => _.set(o, 'Fapp', _.isEmpty(o.Fapp2) ? 'ALL' : o.Fapp2));
        }

        const aRaws = oViewModel.getProperty('/raw/list');
        oViewModel.getProperty('/dialog/list').forEach((o) => {
          _.set(_.find(aRaws, { Zzappee: o.Zzappee }), 'Fapp', o.Fapp);
        });

        this.onSort();
        this.calculateByDepart();
        this.onPressGradeByDepartDialogClose();
      },

      onPressRowDetail(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();

        window.open(`${sHost}#/performanceView/MB/${mRowData.Zzappee}/${mRowData.Zdocid}`, '_blank', 'width=1400,height=800');
      },

      onPressRowEmployee(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();
        const sUsrty = this.isMss() ? 'M' : this.isHass() ? 'H' : '';

        window.open(`${sHost}#/employeeView/${mRowData.Zzappee}/${sUsrty}`, '_blank', 'width=1400,height=800');
      },

      onChangeByDepartSelection(oEvent) {
        const oViewModel = this.getViewModel();
        const aRows = oViewModel.getProperty('/dialog/list');

        if (!oEvent.getParameter('userInteraction')) return;

        if (oEvent.getParameter('rowIndices').length > 1) {
          const bSelectAll = oEvent.getParameter('selectAll');

          oEvent
            .getSource()
            .getBinding('rows')
            .getContexts()
            .forEach((ctx) => _.set(ctx.getObject(), 'tmpSort', bSelectAll ? 0 : 1));

          oViewModel.setProperty('/dialog/list', _.orderBy(aRows, ['tmpSort', 'Zapgma', 'Zzjikgb', 'Zzappee'], ['asc', 'desc', 'asc', 'asc']));
        } else {
          const oRowContext = oEvent.getParameter('rowContext');

          if (!oRowContext) return;

          const oTable = oEvent.getSource();
          const oSelectedObject = oRowContext.getObject();

          oViewModel.setProperty(`${oRowContext.getPath()}/tmpSort`, _.isEqual(oSelectedObject.tmpSort, 1) ? 0 : 1);
          oViewModel.setProperty('/dialog/list', _.orderBy(aRows, ['tmpSort', 'Zapgma', 'Zzjikgb', 'Zzappee'], ['asc', 'desc', 'asc', 'asc']));

          this.oTempTable = oTable;
          this.reselectionTable();
        }
      },

      onPressSave() {
        this.createProcess(Constants.PROCESS_TYPE.SAVE);
      },

      onPressComplete() {
        const oViewModel = this.getViewModel();
        const mSummary = oViewModel.getProperty('/summary/list/1');
        const aGrade = oViewModel.getProperty('/grade');
        const aRaws = oViewModel.getProperty('/raw/list');
        const sZzappun1 = oViewModel.getProperty('/tab/Zzappun1');
        const aLevelResult = [];

        if (!_.isEmpty(sZzappun1)) {
          MessageBox.alert(this.getBundleText('MSG_10018')); // 합계 인원을 조회한 후 완료하시기 바랍니다.
          return;
        }

        if (_.some(aRaws, (o) => _.isEqual(o.Fapp, 'ALL'))) {
          MessageBox.alert(this.getBundleText('MSG_10017')); // 평가등급을 지정하지 않은 인원이 존재합니다.
          return;
        }

        _.chain(mSummary)
          .pickBy((v, p) => _.endsWith(p, 'State'))
          .values()
          .forEach((v, idx) => {
            if (_.isEqual(v, 'Error')) aLevelResult.push(_.get(aGrade, [idx, 'level']));
          })
          .commit();

        let sMessage = this.getBundleText('MSG_10015'); // 완료 후 수정할 수 없습니다.\n완료하시겠습니까?

        if (_.includes(aLevelResult, 'E')) {
          MessageBox.alert(this.getBundleText('MSG_10013')); // 평가완료하신 등급별 인원이 배분율에 따른 기준을 초과하였습니다.\n평가 부여 인원을 확인하시기 바랍니다.
          return;
        } else if (_.includes(aLevelResult, 'W')) {
          sMessage = this.getBundleText('MSG_10014'); // 평가완료하신 등급별 인원이 배분율에 따른 기준을 초과하였습니다.\n그래도 완료하시겠습니까?
        }

        MessageBox.confirm(sMessage, {
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            this.createProcess({ ...Constants.PROCESS_TYPE.SEND, label: 'LABEL_00117' });
          },
        });
      },

      onPressExcelDownload() {
        const oTable = this.byId('performanceGradeTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_10083'); // {성과평가등급산출평가리스트}_목록
        const aTableData = _.chain(this.getViewModel().getProperty('/tab/list'))
          .cloneDeep()
          .reject((o) => _.isEqual(o.Orgtx, 'EMPTY'))
          .value();
        const aCustomColumns = [
          { type: 'String', label: 'No.', property: 'Idx' }, //
          { type: 'String', label: this.getBundleText('LABEL_00209'), property: 'Zzappee' },
          { type: 'String', label: this.getBundleText('LABEL_00210'), property: 'Ename' },
          { type: 'String', label: this.getBundleText('LABEL_00215'), property: 'Zzjikgbt' },
          { type: 'String', label: this.getBundleText('LABEL_00224'), property: 'Orgtx' },
          { type: 'String', label: this.getBundleText('LABEL_10003'), property: 'Zapgme' },
          { type: 'String', label: this.getBundleText('LABEL_10022'), property: 'Zapgma' },
          { type: 'String', label: this.getBundleText('LABEL_10078'), property: 'FappTx' },
        ];

        TableUtils.export({ oTable, aTableData, sFileName, aCustomColumns });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
