sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/performance/constant/Constants',
    'sap/ui/yesco/mvc/model/type/Pernr',
    'sap/ui/yesco/mvc/model/type/Decimal',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
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
          grids: [],
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

          oViewModel.setProperty('/isActive', !_.isEqual(mDetailData.Zonlydsp, 'X') && _.size(mDetailData.AppraisalSesDocDetSet.results) !== 0);
          oViewModel.setProperty('/gradeMap', mGradeMap);
          oViewModel.setProperty('/grade', aGrades);
          oViewModel.setProperty('/gradeEntry', _.take(aGrades, 2));

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

          const aPpomes = _.chain(mDetailData.AppraisalSesDocDetSet.results).map('Zzappun2').uniq().value();
          const aRawData = _.map(mDetailData.AppraisalSesDocDetSet.results, (o, i) => ({
            Idx: ++i,
            ..._.omit(o, '__metadata'),
            LfappTx: _.get(mGradeMap, o.Lfapp, ''),
            FappTx: _.get(mGradeMap, o.Fapp, ''),
            OsortSub: _.findIndex(aPpomes, (d) => d === o.Zzappun2),
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
        const aPpome = _.chain(aRawList).map('Zzappun2').uniq().value();
        const aListByDepart = _.chain(aRawList)
          .orderBy(['OsortSub'], ['asc'])
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
                Osort: _.findIndex(aPpome, (d) => d === _.get(cur, [0, 'Zzappun2'], '')),
                Zzappun2: _.get(cur, [0, 'Zzappun2'], ''),
                Zzappuntx2: _.get(cur, [0, 'Zzappuntx2'], ''),
                TargetCnt: _.chain(cur)
                  .filter((o) => _.isEqual(o.Fapp, '3'))
                  .size()
                  .value(),
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
        oViewModel.setProperty('/department/list', _.compact([...aListByDepart, mSumRow]));
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
          const aList = _.cloneDeep(oViewModel.getProperty('/raw/list'));
          const bIsSave = _.isEqual(code, Constants.PROCESS_TYPE.SAVE.code);

          await Client.deep(oModel, 'AppraisalSesDoc', {
            Menid: this.getCurrentMenuId(),
            Prcty: code,
            AppraisalSesDocDetSet: aList,
          });

          // {저장|전송|승인|취소}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', label), {
            onClose: () => {
              if (!bIsSave) this.getViewModel().setProperty('/isActive', false);
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
          const oRowData = oEvent.getSource().getParent().getBindingContext().getObject();
          const aRawData = _.filter(oViewModel.getProperty('/raw/list'), (o) => _.isEqual(o.Fapp, '3'));
          const aFilteredData = _.isEmpty(oRowData.Zzappun2) ? aRawData : _.filter(aRawData, (o) => _.isEqual(o.Zzappun2, oRowData.Zzappun2));

          oViewModel.setProperty('/tab/zzappun2', oRowData.Zzappun2);
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

      onChangeLfapp(oEvent) {
        const mGradeMap = this.getViewModel().getProperty('/gradeMap');
        const mRowData = oEvent.getSource().getParent().getParent().getBindingContext().getObject();

        _.set(mRowData, 'LfappTx', _.get(mGradeMap, mRowData.Lfapp, ''));

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
        oViewModel.setProperty(`${oDraggPath}/LfappTx`, sDroppedLfapp === '4' ? 'EX' : 'VG');

        this.onSort();
        this.calculateByDepart();
      },

      onSort() {
        const oViewModel = this.getViewModel();
        const iSortIndex = oViewModel.getProperty('/tab/sortIndex');

        switch (iSortIndex) {
          case 0:
            this.orderBy('/tab/list', ['OsortSub', 'Lfapp', 'Fapp', 'Zapgma', 'Zzjikgb', 'Zzappee'], ['asc', 'desc', 'desc', 'desc', 'asc', 'asc']);

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

        this.setEmptyCard();
      },

      async onClickGrade(oEvent) {
        const oView = this.getView();
        const oViewModel = this.getViewModel();
        const mPayload = sap.ui.getCore().byId($(oEvent.currentTarget).attr('id')).data();
        const aRaws = oViewModel.getProperty('/raw/list');
        const mGradeMap = oViewModel.getProperty('/gradeMap');

        if (_.isEqual(mPayload.grade, 'X')) return;

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
              setTimeout(() => {
                const aTableRows = oTable.getBinding('rows');

                oTable.clearSelection();

                aTableRows.filter([new Filter('Zzappun2', FilterOperator.EQ, oTable.data('Zzappun2'))]);
                _.chain(aTableRows.getContexts())
                  .map((ctx) => ctx.getObject())
                  .filter((o) => _.isEqual(o.Lfapp, sGrade))
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
        const oTableContainer = this.byId('gradeByDepartContainer');
        const aDialogList = oViewModel.getProperty('/dialog/list');
        const sGrade = oViewModel.getProperty('/dialog/grade');
        const sGradeTx = oViewModel.getProperty('/dialog/gradeTx');
        const mGVMap = {
          3: { code: '4', text: 'EX' },
          4: { code: '3', text: 'VG' },
        };

        oViewModel.setProperty(
          '/dialog/list',
          _.map(aDialogList, (o) =>
            _.chain(o)
              .set('Lfapp', _.get(mGVMap, [sGrade, 'code']))
              .set('LfappTx', _.get(mGVMap, [sGrade, 'text']))
              .value()
          )
        );

        oTableContainer.getItems().forEach((oTable) => {
          const aTableRowContexts = oTable.getBinding('rows').getContexts();
          const aSelectedIndices = oTable.getSelectedIndices();

          aSelectedIndices.forEach((idx) => {
            _.chain(aTableRowContexts[idx].getObject()).set('Lfapp', sGrade).set('LfappTx', sGradeTx).commit();
          });
        });

        const aRaws = oViewModel.getProperty('/raw/list');
        oViewModel.getProperty('/dialog/list').forEach((o) => {
          _.chain(aRaws).find({ Zzappee: o.Zzappee }).set('Lfapp', o.Lfapp).set('LfappTx', o.LfappTx).commit();
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

        window.open(`${sHost}#/employeeView/${mRowData.Zzappee}/${sUsrty}`, '_blank', 'width=1400&height=800');
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

          oViewModel.setProperty('/dialog/list', _.orderBy(aRows, ['tmpSort', 'Lfapp', 'Fapp', 'Zapgma', 'Zzjikgb', 'Zzappee'], ['asc', 'desc', 'desc', 'desc', 'asc', 'asc']));
        } else {
          const oRowContext = oEvent.getParameter('rowContext');

          if (!oRowContext) return;

          const oTable = oEvent.getSource();
          const oSelectedObject = oRowContext.getObject();

          oViewModel.setProperty(`${oRowContext.getPath()}/tmpSort`, _.isEqual(oSelectedObject.tmpSort, 1) ? 0 : 1);
          oViewModel.setProperty('/dialog/list', _.orderBy(aRows, ['tmpSort', 'Lfapp', 'Fapp', 'Zapgma', 'Zzjikgb', 'Zzappee'], ['asc', 'desc', 'desc', 'desc', 'asc', 'asc']));

          this.oTempTable = oTable;
          this.reselectionTable();
        }
      },

      onPressSave() {
        this.createProcess(Constants.PROCESS_TYPE.SAVE);
      },

      onPressComplete() {
        const oViewModel = this.getViewModel();
        const sZzappun2 = oViewModel.getProperty('/tab/zzappun2');

        if (!_.isEmpty(sZzappun2)) {
          MessageBox.alert(this.getBundleText('MSG_10018')); // 합계 인원을 조회한 후 완료하시기 바랍니다.
          return;
        }

        MessageBox.confirm(this.getBundleText('MSG_10015'), {
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
