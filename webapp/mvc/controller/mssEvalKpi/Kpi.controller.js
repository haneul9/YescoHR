sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/GroupDialogHandler',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    Filter,
    FilterOperator,
    JSONModel,
    Fragment,
    MessageBox,
    AppUtils,
    ComboEntry,
    ServiceNames,
    GroupDialogHandler,
    ODataReadError,
    ODataCreateError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.mssEvalKpi.Kpi', {
      GroupDialogHandler: null,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          BtnStat: true,
          List: [],
          Years: [],
          TeamList: [],
          PartCode: [],
          CompanyCode: [],
          Tmp: [{ TmpGrid: {} }],
          tab: {
            selectedKey: 'A',
          },
          search: {
            Werks: '',
            Orgeh: '',
            Orgtx: '',
            Zyear: '',
          },
          situation: {
            segmentKey: 'A',
          },
          CascadingSitu: {
            SituList: [],
          },
          listRowCount: 1,
        });

        this.setViewModel(oViewModel);
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          const oSessionData = this.getSessionData();
          const aComList = await this.areaList();

          oViewModel.setProperty('/CompanyCode', aComList);

          const aPartList = await this.partList();

          oViewModel.setProperty('/PartCode', aPartList);
          this.setYears();

          oViewModel.setProperty('/search', {
            Werks: oSessionData.Werks,
            Orgeh: aPartList[0].Orgeh,
            Orgtx: aPartList[0].Orgtx,
            Zyear: String(new Date().getFullYear()),
          });
          this.onSearch();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onClick() {
        this.getRouter().navTo('clubJoin-detail', { oDataKey: 'N' });
      },

      // 인사영역Code
      areaList() {
        const oModel = this.getModel(ServiceNames.COMMON);

        return new Promise((resolve, reject) => {
          oModel.read('/PersAreaListSet', {
            success: (oData) => {
              if (oData) {
                this.debug(oData);
                resolve(oData.results);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // 부문Code
      partList(sWerks = this.getSessionProperty('Werks')) {
        const oModel = this.getModel(ServiceNames.APPRAISAL);

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingOrgehSet', {
            filters: [new Filter('Werks', FilterOperator.EQ, sWerks)],
            success: (oData) => {
              if (oData) {
                this.debug(oData);
                resolve(oData.results);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // 평가년도 setting
      setYears(iYear = new Date().getFullYear()) {
        const oViewModel = this.getViewModel();
        const aYearsList = [];

        aYearsList.push({ Zcode: String(iYear), Ztext: `${iYear}년` }, { Zcode: String(iYear - 1), Ztext: `${iYear - 1}년` });

        oViewModel.setProperty('/Years', aYearsList);
      },

      // 저장 BtnVisible
      hideSaveBtn(sWerks = this.getSessionProperty('Werks')) {
        const oModel = this.getModel(ServiceNames.APPRAISAL);

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingActiveSet', {
            filters: [
              //
              new Filter('Werks', FilterOperator.EQ, sWerks),
              new Filter('Zyear', FilterOperator.EQ, this.getViewModel().getProperty('/search/Zyear')),
            ],
            success: (oData) => {
              if (oData) {
                this.debug(oData);
                resolve(oData.results[0].Active === 'X');
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // 평가년도 클릭
      onYearsBtn() {
        this.onSearch();
      },

      // TabBar 선택
      async onSelectTabBar() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          if (oViewModel.getProperty('/tab/selectedKey') !== 'C') {
            const aPartList = await this.partList();

            oViewModel.setProperty('/PartCode', aPartList);
            oViewModel.setProperty('/search', {
              Werks: this.getSessionProperty('Werks'),
              Orgeh: oViewModel.getProperty('/PartCode/0/Orgeh'),
              Orgtx: oViewModel.getProperty('/PartCode/0/Orgtx'),
              Zyear: String(new Date().getFullYear()),
            });
            const aTableList = await this.getAllCascading();
            const iTableLength = aTableList.length;

            oViewModel.setProperty('/List', aTableList);
            oViewModel.setProperty('/listRowCount', iTableLength > 7 ? 7 : iTableLength);

            const aGridList = await this.getPartCascading();

            if (oViewModel.getProperty('/tab/selectedKey') === 'B') {
              this.setTeamGridList(aGridList);
            } else {
              aGridList.unshift({ Stext: this.getBundleText('MSG_15002') });
            }

            oViewModel.setProperty('/PartList', aGridList);
          } else {
            oViewModel.setProperty('/situation/segmentKey', 'A');

            this.GroupDialogHandler = new GroupDialogHandler(this, ([mOrgData]) => {
              oViewModel.setProperty('/search/Orgeh', mOrgData.Orgeh);
              oViewModel.setProperty('/search/Orgtx', mOrgData.Stext);
            });

            oViewModel.setProperty('/CascadingSitu', {
              Label1: this.getBundleText('LABEL_00224'),
              Label2: '',
            });

            oViewModel.setProperty('/search', {
              Werks: this.getSessionProperty('Werks'),
              Zyear: String(new Date().getFullYear()),
            });

            const aTreeList = await this.setTreeList();
            const aVariat = this.oDataChangeTree(aTreeList);

            oViewModel.setProperty('/CascadingSitu/SituList', aVariat);
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // Cascading KPI 종류
      getKPIList() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();
        const mSearch = oViewModel.getProperty('/search');

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingKpiListSet', {
            filters: [new Filter('Werks', FilterOperator.EQ, this.getSessionProperty('Werks')), new Filter('Zyear', FilterOperator.EQ, mSearch.Zyear)],
            success: (oData) => {
              if (oData) {
                this.debug(oData);
                resolve(new ComboEntry({ codeKey: 'Objid', valueKey: 'Stext', aEntries: oData.results }));
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // Cascading 현황 SegmaneBtn
      async onSegmentBtn() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/search', {
          Werks: this.getSessionProperty('Werks'),
          Zyear: String(new Date().getFullYear()),
          Objid: 'ALL',
          Otype: '',
        });

        if (oViewModel.getProperty('/situation/segmentKey') === 'A') {
          oViewModel.setProperty('/CascadingSitu', {
            Label1: this.getBundleText('LABEL_00224'),
            Label2: '',
          });
        } else {
          const aKpiList = await this.getKPIList();

          oViewModel.setProperty('/CascadingSitu', {
            Label1: this.getBundleText('LABEL_00220'),
            Label2: this.getBundleText('LABEL_15014'),
            SecondCode: aKpiList,
          });
        }

        const aTreeList = await this.setTreeList();
        const aVariat = this.oDataChangeTree(aTreeList);

        oViewModel.setProperty('/CascadingSitu/SituList', aVariat);
      },

      // Cascading 현황에 조직 별 treetable
      setTreeList() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();
        const mSearch = oViewModel.getProperty('/search');
        const bKey = oViewModel.getProperty('/situation/segmentKey') === 'A';

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingTreeSet', {
            filters: [
              new Filter('Werks', FilterOperator.EQ, mSearch.Werks), //
              new Filter('Zyear', FilterOperator.EQ, mSearch.Zyear),
              new Filter('Seroty', FilterOperator.EQ, bKey ? 'O' : mSearch.Otype),
              new Filter('Serobj', FilterOperator.EQ, bKey ? '' : mSearch.Objid === 'ALL' ? '' : mSearch.Objid),
            ],
            success: (oData) => {
              if (oData) {
                this.debug(oData);
                resolve(oData.results);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // Cascading 조회
      async onCasSituList() {
        const oViewModel = this.getViewModel();
        const aTreeList = await this.setTreeList();
        const aVariat = this.oDataChangeTree(aTreeList);

        oViewModel.setProperty('/CascadingSitu/SituList', aVariat);
      },

      // oData Tree구조로 만듦
      oDataChangeTree(aList = []) {
        const aConvertedList = _.chain(aList)
          .cloneDeep()
          .map((o) => _.omit(o, '__metadata'))
          .value();
        const mGroupedByParents = _.groupBy(aConvertedList, 'ObjidUp');
        const mCatsById = _.keyBy(aConvertedList, 'Objid');
        const oTree = this.byId('SituTree');

        oTree.collapseAll();
        oTree.expandToLevel(1);
        _.each(_.omit(mGroupedByParents, '00000000'), (children, parentId) => _.set(mCatsById, [parentId, 'children'], children));

        return mGroupedByParents['00000000'];
      },

      onCasSituSecSelect(oEvent) {
        const oViewModel = this.getViewModel();
        const sKey = oEvent.getSource().getSelectedKey();

        oViewModel.getProperty('/CascadingSitu/SecondCode').forEach((e) => {
          if (sKey === e.Objid) {
            oViewModel.setProperty('/search/Otype', e.Otype || '');
          }
        });
      },

      // 부문에 해당되는 팀 Cadcading
      detailTeamList() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();
        const mSearch = oViewModel.getProperty('/search');

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingTeamListSet', {
            filters: [new Filter('Zyear', FilterOperator.EQ, mSearch.Zyear), new Filter('Otype', FilterOperator.EQ, mSearch.Otype), new Filter('Objid', FilterOperator.EQ, mSearch.Objid)],
            success: (oData) => {
              if (oData) {
                this.debug(oData);
                resolve(oData.results);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // 회사선택
      async onCompSelect(oEvent) {
        const oViewModel = this.getViewModel();
        const aPartList = await this.partList(oEvent.getSource().getSelectedKey());

        oViewModel.setProperty('/PartCode', aPartList);
        oViewModel.setProperty('/search/Orgeh', !!aPartList.length ? aPartList[0].Orgeh : '');
        oViewModel.setProperty('/search/Orgtx', !!aPartList.length ? aPartList[0].Orgtx : '');

        const sBtnStat = await this.hideSaveBtn(oViewModel.getProperty('/search/Werks'));

        oViewModel.setProperty('/BtnStat', sBtnStat);
      },

      async onSearch() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);
        try {
          const sBtnStat = await this.hideSaveBtn(oViewModel.getProperty('/search/Werks'));

          oViewModel.setProperty('/BtnStat', sBtnStat);

          const aTableList = await this.getAllCascading();
          const iTableLength = aTableList.length;

          oViewModel.setProperty('/List', aTableList);
          oViewModel.setProperty('/listRowCount', iTableLength > 7 ? 7 : iTableLength);

          const aPartList = await this.getPartCascading();

          if (oViewModel.getProperty('/tab/selectedKey') === 'B') {
            this.setTeamGridList(aPartList);
          } else {
            aPartList.unshift({ Stext: this.getBundleText('MSG_15002') });
          }

          oViewModel.setProperty('/PartList', aPartList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 부문 선택
      async onPartSelect(oEvent) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/search/Orgtx', oEvent.getSource().getValue());

        const sBtnStat = await this.hideSaveBtn(oViewModel.getProperty('/search/Werks'));

        oViewModel.setProperty('/BtnStat', sBtnStat);
      },

      // 수행 팀 수 Link Press
      async onPressTeam(oEvent) {
        try {
          const sPath = oEvent.getSource().getBindingContext().getPath();
          const oView = this.getView();
          const oViewModel = this.getViewModel();
          const aList = await this.getTeamList(oViewModel.getProperty(sPath));
          const iLength = aList.length;

          if (!iLength) {
            return;
          }

          oViewModel.setProperty('/TeamList', aList);
          oViewModel.setProperty('/TeamRowCount', iLength);

          if (!this.dTeamListDialog) {
            this.dTeamListDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.mssEvalKpi.fragment.tabDetail.dialog.TeamList',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          this.dTeamListDialog.then(function (oDialog) {
            oDialog.open();
          });
        } catch (oError) {
          AppUtils.handleError(oError);
        }
      },

      onCloseClick(oEvent) {
        oEvent.getSource().getParent().close();
      },

      // GridContainer의 정의서 url
      onUrlPress(oEvent) {
        window.open(this.getViewModel().getProperty(`${oEvent.getSource().getBindingContext().getPath()}/Url`), '_blank');
      },

      // 수행 팀 목록 조회
      getTeamList(mSelectedRow = {}) {
        const oModel = this.getModel(ServiceNames.APPRAISAL);

        this.getViewModel().setProperty('/TeamList', []);

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingTeamListSet', {
            filters: [new Filter('Zyear', FilterOperator.EQ, mSelectedRow.Zyear), new Filter('Otype', FilterOperator.EQ, mSelectedRow.Otype), new Filter('Objid', FilterOperator.EQ, mSelectedRow.Objid)],
            success: (oData) => {
              if (oData) {
                this.debug(oData);
                resolve(oData.results);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // teamcascading 드롭
      onTeamDrop(oInfo) {
        const oViewModel = this.getViewModel();
        const oDragged = oInfo.getParameter('draggedControl');
        const oDropped = oInfo.getParameter('droppedControl');
        const oDraggPath = oDragged.getBindingContext().getPath();
        const oGrid = oDropped.getParent();
        const mDraggData = oViewModel.getProperty(oDraggPath);
        const sDraggListPath = oDropped.getParent().getBindingContext().getPath();
        const sDropPath = `${sDraggListPath}/TmpGrid`;
        const aGridList = oViewModel.getProperty(sDropPath);
        const bDragIndex = oGrid.indexOfItem(oDragged) === -1;
        let bInsertPosition = oInfo.getParameter('dropPosition') === 'Before';
        let iDropPosition = oGrid.indexOfItem(oDropped);

        // 빈 박스 드롭시 , 첫번째 drop시
        if (!mDraggData.Ztext || (iDropPosition === 0 && !bDragIndex)) {
          return;
        }

        // 부문 중복체크
        if (
          oDropped.sParentAggregationName !== oDragged.sParentAggregationName &&
          aGridList.some((e) => {
            return e.Otype === mDraggData.Otype && e.Stext === mDraggData.Stext;
          })
        ) {
          MessageBox.alert(this.getBundleText('MSG_15001'));
          return;
        }

        // remove the item
        const iDragPosition = bDragIndex ? 0 : oGrid.indexOfItem(oDragged);

        if (!bDragIndex) {
          aGridList.splice(iDragPosition, 1);

          // if (iDragPosition < iDropPosition && aGridList.length === iDropPosition) {
          //   iDropPosition--;
          // }
        } else {
          if (iDropPosition === 0) {
            iDropPosition++;
          }
        }

        mDraggData.Orgeh = oViewModel.getProperty(`${sDraggListPath}/Orgeh`);
        mDraggData.Orgtx = oViewModel.getProperty(`${sDraggListPath}/Label`);
        mDraggData.Zteam = mDraggData.Tmcnt === '0' ? '' : 'X';

        // insert the control in target aggregation bInsertPosition ? 0 : -1
        aGridList.splice(iDropPosition, 0, mDraggData);
        oViewModel.setProperty(sDropPath, aGridList);
        oViewModel.setProperty('/PartList', [mDraggData, ...oViewModel.getProperty('/PartList')]);
      },

      // 부문 drop
      onDrop(oInfo) {
        const oViewModel = this.getViewModel();
        const oDragged = oInfo.getParameter('draggedControl');
        const oDropped = oInfo.getParameter('droppedControl');
        const oDraggPath = oDragged.getBindingContext().getPath();
        const oGrid = oDropped.getParent();
        const mDraggData = oViewModel.getProperty(oDraggPath);
        const aGridList = oViewModel.getProperty('/PartList');
        const bDragIndex = oGrid.indexOfItem(oDragged) === -1;
        let bInsertPosition = oInfo.getParameter('dropPosition') === 'Before';
        let iDropPosition = oGrid.indexOfItem(oDropped);

        // 빈 박스 드롭시 , 첫번째 Drop시
        if (!mDraggData.Objid || (iDropPosition === 0 && !bDragIndex)) {
          return;
        }

        // 부문 중복체크
        if (
          oDropped.sParentAggregationName !== oDragged.sParentAggregationName &&
          aGridList.some((e) => {
            return e.Otype === mDraggData.Otype && e.Stext === mDraggData.Stext;
          })
        ) {
          MessageBox.alert(this.getBundleText('MSG_15001'));
          return;
        }

        // remove the item
        const iDragPosition = bDragIndex ? 0 : oGrid.indexOfItem(oDragged);

        if (!bDragIndex) {
          aGridList.splice(iDragPosition, 1);

          // if (iDragPosition < iDropPosition && aGridList.length === iDropPosition) {
          //   iDropPosition--;
          // }
        } else {
          if (iDropPosition === 0) {
            iDropPosition++;
          }
        }

        mDraggData.Orgeh = oViewModel.getProperty('/search/Orgeh');
        mDraggData.Zteam = mDraggData.Tmcnt === '0' ? '' : 'X';

        // insert the control in target aggregation
        aGridList.splice(iDropPosition, 0, mDraggData);
        oViewModel.setProperty('/PartList', aGridList);
      },

      // table rowData Drag
      onDragStart(oEvent) {
        const oDraggedRow = oEvent.getParameter('target');
        const oDragSession = oEvent.getParameter('dragSession');

        // keep the dragged row context for the drop action
        oDragSession.setComplexData('draggedRowContext', oDraggedRow.getBindingContext());
      },

      // DropEvent
      onDropTable(oEvent) {
        const oViewModel = this.getViewModel();
        const oDragSession = oEvent.getParameter('dragSession');
        const oDraggedRowContext = oDragSession.getComplexData('draggedRowContext');
        const sDraggPath = oDraggedRowContext.getPath();
        const mDraggData = oViewModel.getProperty(sDraggPath);
        const bTabKey = oViewModel.getProperty('/tab/selectedKey') === 'A';

        if (!oDraggedRowContext || !mDraggData.Objid || oDragSession.getDragControl().getMetadata().getElementName().search('GridListItem') === -1) return;

        const aGridList = bTabKey ? oViewModel.getProperty('/PartList') : oViewModel.getProperty(sDraggPath.slice(0, sDraggPath.lastIndexOf('/')));
        const aPartList = aGridList.filter((x) => ![mDraggData].includes(x));

        // reset the rank property and update the model to refresh the bindings
        oViewModel.setProperty(bTabKey ? '/PartList' : sDraggPath.slice(0, sDraggPath.lastIndexOf('/')), aPartList);
        oViewModel.refresh(true);
      },

      // table cascading조회
      getAllCascading() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oListModel = this.getViewModel();
        const oSearch = oListModel.getProperty('/search');

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingListSet', {
            filters: [new Filter('Gubun', FilterOperator.EQ, oListModel.getProperty('/tab/selectedKey')), new Filter('Werks', FilterOperator.EQ, oSearch.Werks), new Filter('Orgeh', FilterOperator.EQ, oSearch.Orgeh), new Filter('Zyear', FilterOperator.EQ, oSearch.Zyear)],
            success: (oData) => {
              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // grid cascading조회
      getPartCascading(sOrgeh = '') {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oListModel = this.getViewModel();
        const oSearch = oListModel.getProperty('/search');
        const sKey = oListModel.getProperty('/tab/selectedKey');

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingOrgListSet', {
            filters: [new Filter('Gubun', FilterOperator.EQ, sKey), new Filter('Werks', FilterOperator.EQ, oSearch.Werks), new Filter('Orgeh', FilterOperator.EQ, sOrgeh || oSearch.Orgeh), new Filter('Zyear', FilterOperator.EQ, oSearch.Zyear)],
            success: (oData) => {
              if (oData) {
                const aGridList = oData.results;
                let aNotEmpty = [];

                if (sKey === 'A') {
                  aNotEmpty = aGridList.filter((e) => {
                    return !!e.Stext || !!e.Ztext;
                  });
                } else {
                  aGridList.forEach((e) => {
                    if (!e.Stext && !e.Ztext) {
                      aNotEmpty.push({
                        Label: e.Orgtx,
                        Orgtx: e.Orgtx,
                        Orgeh: e.Orgeh,
                        TmpGrid: [],
                      });
                    } else {
                      aNotEmpty.push(e);
                    }
                  });
                }

                resolve(aNotEmpty);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // 부서선택
      onPressSearchOrgeh() {
        this.GroupDialogHandler.openDialog();
      },

      // 팀 cascading grid settings
      setTeamGridList(aList = []) {
        const oViewModel = this.getViewModel();
        const sTempMessage = this.getBundleText('MSG_15002');
        let aFilterList = [];

        if (!aList.length) {
          aFilterList = [];
        } else {
          aFilterList = _.chain(aList)
            .groupBy('Orgtx')
            .map((v, p) => ({ Label: p, Orgeh: v[0].Orgeh, TmpGrid: !!v[0].Ztext || !!v[0].Stext ? v : [] }))
            .forEach((o) => o.TmpGrid.unshift({ Stext: sTempMessage }))
            .value();
        }

        oViewModel.setProperty('/Tmp', aFilterList);
      },

      // 저장
      onSaveBtn() {
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          // {저장}하시겠습니까?
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')], // 저장, 취소
          onClose: async (vPress) => {
            if (!vPress || vPress !== this.getBundleText('LABEL_00103')) {
              // 저장
              return;
            }

            try {
              AppUtils.setAppBusy(true, this);

              const oViewModel = this.getViewModel();
              const sTabKey = oViewModel.getProperty('/tab/selectedKey');
              const aList = [];
              let aGridData = [];

              if (sTabKey === 'A') {
                aGridData = oViewModel.getProperty('/PartList');

                aGridData.forEach((e) => {
                  if (!!e.Otype) {
                    aList.push(e);
                  }
                });
              } else {
                aGridData = oViewModel.getProperty('/Tmp');

                aGridData.forEach((e) => {
                  const TmpList = e.TmpGrid;

                  aList.push(...TmpList);
                });
              }

              let oSendObject = {
                Gubun: sTabKey,
                Zyear: oViewModel.getProperty('/search/Zyear'),
                KpiCascadingNav: aList,
              };

              const oModel = this.getModel(ServiceNames.APPRAISAL);

              await new Promise((resolve, reject) => {
                oModel.create('/KpiCascadingOrgListSet', oSendObject, {
                  success: () => {
                    resolve();
                  },
                  error: (oError) => {
                    reject(new ODataCreateError({ oError }));
                  },
                });
              });

              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103')); // {저장}되었습니다.
              this.onSearch();
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false, this);
            }
          },
        });
      },
    });
  }
);
