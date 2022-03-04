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
    'sap/ui/yesco/mvc/model/type/Pernr',
    'sap/ui/yesco/mvc/model/type/Decimal',
    'sap/f/GridContainer',
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

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.Session', {
      initializeModel() {
        return {
          busy: false,
          pageBusy: false,
          isActive: false,
          groups: [],
          grade: [],
          gradeMap: {},
          gradeEntry: [],
          grids: [
            {
              Zzappgr: 'X',
              ZzappgrTxt: '평가그룹',
              grades: [
                { code: '4', text: 'EX', active: true, width: '25%' },
                { code: 'X', text: '평가그룹', active: false, width: '12.5%' },
                { code: '3', text: 'VG', active: true, width: '62.5%' },
              ],
            },
            {
              Zzappgr: 'Y2',
              ZzappgrTxt: '팀장',
              grades: [
                { code: '4', text: 'EX', Zzappgr: 'Y2', active: true, width: '25%' },
                { code: 'X', text: '팀장', Zzappgr: 'Y2', active: false, width: '12.5%' },
                { code: '3', text: 'VG', Zzappgr: 'Y2', active: true, width: '62.5%' },
              ],
            },
            {
              Zzappgr: 'Y3',
              ZzappgrTxt: '과장 이상',
              grades: [
                { code: '4', text: 'EX', Zzappgr: 'Y3', active: true, width: '25%' },
                { code: 'X', text: '과장 이상', Zzappgr: 'Y3', active: false, width: '12.5%' },
                { code: '3', text: 'VG', Zzappgr: 'Y3', active: true, width: '62.5%' },
              ],
            },
            {
              Zzappgr: 'Y4',
              ZzappgrTxt: '대리 이하',
              grades: [
                { code: '4', text: 'EX', Zzappgr: 'Y4', active: true, width: '25%' },
                { code: 'X', text: '대리 이하', Zzappgr: 'Y4', active: false, width: '12.5%' },
                { code: '3', text: 'VG', Zzappgr: 'Y4', active: true, width: '62.5%' },
              ],
            },
          ],
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
          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const [aGrades, mDetailData] = await Promise.all([
            Client.getEntitySet(oModel, 'AppValueList', { VClass: 'Q', VType: '810' }), //
            Client.deep(oModel, 'AppraisalSesDoc', {
              Menid: this.getCurrentMenuId(),
              Prcty: Constants.PROCESS_TYPE.DETAIL.code,
              AppraisalApGroupSet: [],
              AppraisalSesDocDetSet: [],
            }),
          ]);

          const mGradeMap = _.reduce(aGrades, (acc, cur) => ({ ...acc, [cur.ValueEid]: cur.ValueText }), {});

          // oViewModel.setProperty('/isActive', !_.isEqual(mParameter.Zonlydsp, 'X') && _.isEqual('42', `${mParameter.Zzapsts}${mParameter.ZzapstsSub}`));
          oViewModel.setProperty('/isActive', true);
          oViewModel.setProperty('/gradeMap', mGradeMap);
          oViewModel.setProperty('/grade', aGrades);
          oViewModel.setProperty('/gradeEntry', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aGrades }));

          const aGroups = _.map(mDetailData.AppraisalApGroupSet.results, (o) => _.omit(o, '__metadata'));
          const aTemplateGrades = _.chain(aGrades)
            .take(2)
            .map((o, i) => ({ code: o.ValueEid, text: o.ValueText, active: true, width: _.isEqual(i, 0) ? '25%' : '62.5%' }))
            .thru((arr) => {
              arr.splice(1, 0, { code: 'X', text: this.getBundleText('LABEL_10066'), active: false, width: '12.5%' });
              return arr;
            })
            .value();

          oViewModel.setProperty('/groups', aGroups);
          oViewModel.setProperty(
            '/grids',
            _.chain(aGroups)
              .thru((arr) => {
                arr.splice(0, 0, { Zzappgr: 'X', ZzappgrTxt: this.getBundleText('LABEL_10066') });
                return arr;
              })
              .map((o) =>
                _.set(
                  o,
                  'grades',
                  _.chain(aTemplateGrades)
                    .cloneDeep()
                    .set([1, 'text'], o.ZzappgrTxt)
                    .map((d) => _.set(d, 'Zzappgr', o.Zzappgr))
                    .value()
                )
              )
              .value()
          );

          const aRawData = _.map(mDetailData.AppraisalSesDocDetSet.results, (o, i) => ({
            Idx: ++i,
            ..._.omit(o, '__metadata'),
            Lfapp: _.isEmpty(o.Lfapp) ? 'ALL' : o.Lfapp,
            LfappTx: _.get(mGradeMap, o.Lfapp, ''),
            FappTx: _.get(mGradeMap, o.Fapp, ''),
            OsortSub: `${o.Osort}-${o.Orgeh}`,
          }));

          oViewModel.setProperty('/raw/list', aRawData);
          oViewModel.setProperty(
            '/tab/list',
            _.filter(aRawData, (o) => _.isEqual(o.Fapp, '3'))
          );
          oViewModel.setProperty('/tab/rowCount', Math.min(_.size(aRawData), 10));

          this.calculateByDepart();
          this.onSort();
        } catch (oError) {
          this.debug(`Controller > m/performanceSession > onObjectMatched Error`, oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);

          setTimeout(() => {
            this.setGridFilter();
          }, 100);
        }
      },

      setGridFilter() {
        _.tail(this.byId('gridBox').getItems()).forEach((box) => {
          var oGroupContainerItems = box.getItems()[1].getItems();

          oGroupContainerItems.forEach((item) => {
            const oGridContainerBox = item.getItems()[0];

            if (oGridContainerBox.getBinding('visible').getValue()) {
              const oGridContainer = oGridContainerBox.getItems()[0];

              oGridContainer.getBinding('items').filter(_.map(oGridContainer.data(), (v, p) => new Filter(p, FilterOperator.EQ, v)));
            }
          });
        });
      },

      setEmptyCard() {
        const oViewModel = this.getViewModel();
        const aList = oViewModel.getProperty('/tab/list');

        _.remove(aList, (o) => _.isEmpty(o.Ename));

        const aGrade = oViewModel.getProperty('/grade');
        const aGroups = oViewModel.getProperty('/groups');
        const mLFappCount = _.chain(aList)
          .filter((o) => !_.isEqual(o.Lfapp, 'ALL'))
          .map((o) => _.set(o, 'GridGroup', `${o.Lfapp}-${o.Zzappgr}`))
          .countBy('GridGroup')
          .value();

        _.chain(aGrade)
          .take(2)
          .forEach((v) => {
            aGroups.forEach((gv) => {
              if (!_.has(mLFappCount, `${v.ValueEid}-${gv.Zzappgr}`)) aList.push({ Lfapp: v.ValueEid, Zzappgr: gv.Zzappgr, Zzappuntx2: 'EMPTY' });
            });
          })
          .commit();

        oViewModel.setProperty('/tab/list', aList);
      },

      calculateByDepart() {
        const oViewModel = this.getViewModel();
        const aGrades = oViewModel.getProperty('/grade');
        const aRawList = oViewModel.getProperty('/raw/list');
        const iRawTotalCount = _.size(aRawList);
        const aListByDepart = _.chain(aRawList)
          .groupBy('Zzappun2')
          .reduce((acc, cur) => {
            const mLFappCount = _.countBy(cur, 'Lfapp');
            const sDept01 = _.get(mLFappCount, _.get(aGrades, [0, 'ValueEid']), 0);
            const sDept03 = _.get(mLFappCount, _.get(aGrades, [1, 'ValueEid']), 0);
            const sDept05 = _.get(mLFappCount, _.get(aGrades, [2, 'ValueEid']), 0);
            const sDept07 = _.get(mLFappCount, _.get(aGrades, [3, 'ValueEid']), 0);
            const sDept09 = _.chain(mLFappCount).values().sum().value();

            return [
              ...acc,
              {
                Zzappun2: _.get(cur, [0, 'Zzappun2'], ''),
                Zzappuntx2: _.get(cur, [0, 'Zzappuntx2'], ''),
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
          .value();

        const sSumLabel = this.getBundleText('LABEL_00172'); // 합계
        const mSumRow = TableUtils.generateSumRow({
          aTableData: aListByDepart,
          mSumField: { Zzappuntx2: sSumLabel },
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
          this.oTempTable
            .getBinding('rows')
            .getContexts()
            .map((ctx, idx) => {
              if (_.isEqual(_.get(ctx.getObject(), 'tmpSort'), 0)) {
                this.oTempTable.addSelectionInterval(idx, idx);
              }
            });
        }, 0);
      },

      async createProcess({ code, label }) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/pageBusy', true);

        try {
          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const aList = _.cloneDeep(oViewModel.getProperty('/raw/list'));
          const bIsSave = _.isEqual(code, Constants.PROCESS_TYPE.SAVE.code);

          await Client.deep(oModel, 'AppraisalSesDoc', {
            Menid: this.getCurrentMenuId(),
            Prcty: code,
            Appraisal2GDocDetSet: _.map(aList, (o) => _.set(o, 'Fapp', _.isEqual(o.Fapp, 'ALL') ? '' : o.Fapp)),
          });

          // {저장|전송|승인|취소}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', label), {
            onClose: () => {
              if (!bIsSave) this.onNavBack();
            },
          });
        } catch (oError) {
          this.debug(`Controller > m/performanceSession > createProcess Error`, oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/pageBusy', false);
        }
      },

      formatRowHighlight(sValue) {
        switch (_.toNumber(sValue)) {
          case 4:
            return sap.ui.core.IndicationColor.Indication04;
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
          const sPath = oEvent.getParameters().rowBindingContext.getPath();
          const oRowData = oViewModel.getProperty(sPath);
          const aRawData = _.filter(oViewModel.getProperty('/raw/list'), (o) => _.isEqual(o.Fapp, '3'));
          const aFilteredData = _.isEmpty(oRowData.Zzappun2) ? aRawData : _.filter(aRawData, (o) => _.isEqual(o.Zzappun2, oRowData.Zzappun2));

          oViewModel.setProperty('/tab/list', aFilteredData);
          oViewModel.setProperty('/tab/rowCount', Math.min(_.size(aFilteredData), 10));

          this.onSort();
        } catch (oError) {
          this.debug(`Controller > m/performanceSession > onSelectRow Error`, oError);

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

        const sDroppedLfapp = oDropped.getParent().data('Lfapp');
        oViewModel.setProperty(`${oDraggPath}/Lfapp`, sDroppedLfapp);

        this.onSort();
        this.calculateByDepart();
      },

      onSort() {
        const oViewModel = this.getViewModel();
        const iSortIndex = oViewModel.getProperty('/tab/sortIndex');

        oViewModel.setProperty(
          '/tab/list',
          _.map(oViewModel.getProperty('/tab/list'), (o) => _.set(o, 'Lfapp', _.isEqual(o.Lfapp, 'ALL') ? '' : o.Lfapp))
        );

        switch (iSortIndex) {
          case 0:
            this.orderBy('/tab/list', ['Osort', 'OsortSub', 'Lfapp', 'Fapp', 'Zapgma', 'Zzjikgb', 'Zzappee'], ['asc', 'asc', 'desc', 'desc', 'desc', 'asc', 'asc']);

            break;
          case 1:
            this.orderBy('/tab/list', ['Fapp', 'Zapgma', 'Zzjikgb', 'Zzappee'], ['desc', 'desc', 'asc', 'asc']);

            break;
          case 2:
            this.orderBy('/tab/list', ['Lfapp', 'Fapp', 'Zapgma', 'Zzjikgb', 'Zzappee'], ['desc', 'desc', 'desc', 'asc', 'asc']);

            break;
          default:
            break;
        }

        oViewModel.setProperty(
          '/tab/list',
          _.map(oViewModel.getProperty('/tab/list'), (o) => _.set(o, 'Lfapp', _.isEqual(o.Lfapp, '') ? 'ALL' : o.Lfapp))
        );

        this.setEmptyCard();
      },

      async onClickGrade(oEvent) {
        const oView = this.getView();
        const oViewModel = this.getViewModel();
        const mPayload = sap.ui.getCore().byId($(oEvent.currentTarget).attr('id')).data();
        const aRaws = oViewModel.getProperty('/raw/list');
        const mGradeMap = oViewModel.getProperty('/gradeMap');

        oViewModel.setProperty('/dialog', {
          ...mPayload,
          busy: true,
          list: _.chain(aRaws)
            .filter((o) => _.isEqual(o.Fapp, '3'))
            .cloneDeep()
            .map((o) =>
              _.chain(o)
                .set('FappTx', _.get(mGradeMap, o.Fapp, ''))
                .set('LfappTx', _.get(mGradeMap, o.Lfapp, ''))
                .set('tmpSort', _.isEqual(o.Lfapp, mPayload.grade) ? 0 : 1)
                .value()
            )
            .orderBy(['tmpSort', 'Lfapp', 'Fapp', 'Zapgma', 'Zzjikgb', 'Zzappee'], ['asc', 'desc', 'desc', 'desc', 'asc', 'asc'])
            .value(),
        });

        if (!this.oGradeDialog) {
          this.oGradeDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.performance.fragment.session.DialogGradeByDepart',
            controller: this,
          });

          this.oGradeDialog.attachAfterOpen(() => {
            const oTableContainer = this.byId('gradeByDepartContainer');
            const sGrade = this.getViewModel().getProperty('/dialog/grade');

            oTableContainer.getItems().map((oTable) => {
              const aTableRows = oTable.getBinding('rows');

              oTable.clearSelection();

              aTableRows.filter([new Filter('Zzappun2', FilterOperator.EQ, oTable.data('Zzappun2'))]);
              aTableRows.getContexts().map((ctx, idx) => {
                if (_.isEqual(_.get(ctx.getObject(), 'Lfapp'), sGrade)) {
                  oTable.addSelectionInterval(idx, idx);
                }
              });
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

        const oTableContainer = this.byId('gradeByDepartContainer');
        const aRaws = oViewModel.getProperty('/raw/list');
        const sGrade = oViewModel.getProperty('/dialog/grade');

        _.chain(aRaws)
          .filter((o) => _.isEqual(o.Fapp, sGrade))
          .forEach((o) => _.set(o, 'Fapp', ''))
          .commit();

        oViewModel.setProperty('/raw/list', aRaws);

        oTableContainer.getItems().forEach((oTable) => {
          const aTableRowContexts = oTable.getBinding('rows').getContexts();
          const aSelectedIndices = oTable.getSelectedIndices();

          aSelectedIndices.forEach((idx) => oViewModel.setProperty(`${aTableRowContexts[idx].getPath()}/Fapp`, sGrade));
        });

        this.onSort();
        this.calculateByDepart();
        this.onPressGradeByDepartDialogClose();
      },

      onPressRowDetail(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();

        window.open(`${sHost}#/performanceView/MB/${mRowData.Zzappee}/${mRowData.Zdocid}`, '_blank', 'width=1400&height=800');
      },

      onPressRowEmployee(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();

        window.open(`${sHost}#/employeeView/${mRowData.Zzappee}`, '_blank', 'width=1400&height=800');
      },

      onChangeByDepartSelection(oEvent) {
        const oViewModel = this.getViewModel();
        const aRows = oViewModel.getProperty('/dialog/list');
        const oTable = oEvent.getSource();
        const oRowContext = oEvent.getParameter('rowContext');

        if (!oEvent.getParameter('userInteraction')) return;
        if (!oRowContext) return;

        const oSelectedObject = oRowContext.getObject();

        oViewModel.setProperty(`${oRowContext.getPath()}/tmpSort`, _.isEqual(oSelectedObject.tmpSort, 1) ? 0 : 1);
        oViewModel.setProperty('/dialog/list', _.orderBy(aRows, ['tmpSort', 'Lfapp', 'Fapp', 'Zapgma', 'Zzjikgb', 'Zzappee'], ['asc', 'desc', 'desc', 'desc', 'asc', 'asc']));

        this.oTempTable = oTable;
        this.reselectionTable();
      },

      onPressSave() {
        this.createProcess(Constants.PROCESS_TYPE.SAVE);
      },

      onPressComplete() {
        const oViewModel = this.getViewModel();
        const mSummary = oViewModel.getProperty('/summary/list/1');
        const aGrade = oViewModel.getProperty('/grade');
        const aLevelResult = [];

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

            this.createProcess(Constants.PROCESS_TYPE.SEND);
          },
        });
      },

      onPressExcelDownload() {
        const oTable = this.byId('performanceSessionTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_10096'); // {성과평가전사세션평가리스트}_목록
        const aTableData = _.chain(this.getViewModel().getProperty('/tab/list'))
          .cloneDeep()
          .reject((o) => _.isEqual(o.Zzappuntx2, 'EMPTY'))
          .value();
        const aCustomColumns = [
          { type: 'String', label: 'No.', property: 'Idx' }, //
          { type: 'String', label: this.getBundleText('LABEL_00209'), property: 'Zzappee' },
          { type: 'String', label: this.getBundleText('LABEL_00210'), property: 'Ename' },
          { type: 'String', label: this.getBundleText('LABEL_00215'), property: 'Zzjikgbt' },
          { type: 'String', label: this.getBundleText('LABEL_10094'), property: 'Zzappuntx2' },
          { type: 'String', label: this.getBundleText('LABEL_00224'), property: 'Orgtx' },
          { type: 'String', label: this.getBundleText('LABEL_10003'), property: 'Zapgme' },
          { type: 'String', label: this.getBundleText('LABEL_10022'), property: 'Zapgma' },
          { type: 'String', label: this.getBundleText('LABEL_10078'), property: 'FappTx' },
          { type: 'String', label: this.getBundleText('LABEL_10095'), property: 'LfappTx' },
        ];

        TableUtils.export({ oTable, aTableData, sFileName, aCustomColumns });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
