sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    'sap/ui/core/dnd/DragInfo',
    'sap/ui/core/dnd/DropInfo',
    'sap/ui/core/dnd/DropPosition',
    'sap/ui/core/dnd/DropLayout',
    'sap/f/dnd/GridDropInfo',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/m/VBox',
  ],
  function (JSONModel, Fragment, DragInfo, DropInfo, DropPosition, DropLayout, GridDropInfo, MessageBox, AppUtils, TableUtils, TextUtils, ServiceNames, ODataReadError, ODataCreateError, BaseController, VBox) {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.mssEvalKpi.Kpi', {
      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
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
            filters: [new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, sWerks)],
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

      // TabBar 선택
      async onSelectTabBar() {
        const oViewModel = this.getViewModel();
        const aPartList = await this.partList();

        oViewModel.setProperty('/PartCode', aPartList);
        oViewModel.setProperty('/search', {
          Werks: this.getSessionProperty('Werks'),
          Orgeh: oViewModel.getProperty('/PartCode/0/Orgeh'),
          Orgtx: oViewModel.getProperty('/PartCode/0/Orgtx'),
          Zyear: String(new Date().getFullYear()),
        });

        try {
          oViewModel.setProperty('/busy', true);

          if (oViewModel.getProperty('/tab/selectedKey') !== 'C') {
            const aTableList = await this.getAllCascading();
            const iTableLength = aTableList.length;

            oViewModel.setProperty('/List', aTableList);
            oViewModel.setProperty('/listRowCount', iTableLength > 10 ? 10 : iTableLength);

            const aPartList = await this.getPartCascading();

            if (oViewModel.getProperty('/tab/selectedKey') === 'B') {
              this.setTeamGridList(aPartList);
            } else {
              aPartList.push({ Stext: this.getBundleText('MSG_15002') });
            }

            oViewModel.setProperty('/PartList', aPartList);
          } else {
            //
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 부문에 해당되는 팀 Cadcading
      detailTeamList() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();
        const mSearch = oViewModel.getProperty('/search');

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingTeamListSet', {
            filters: [new sap.ui.model.Filter('Zyear', sap.ui.model.FilterOperator.EQ, mSearch.Zyear), new sap.ui.model.Filter('Otype', sap.ui.model.FilterOperator.EQ, mSearch.Otype), new sap.ui.model.Filter('Objid', sap.ui.model.FilterOperator.EQ, mSearch.Objid)],
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
      },

      async onSearch() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);
        try {
          const aTableList = await this.getAllCascading();
          const iTableLength = aTableList.length;

          oViewModel.setProperty('/List', aTableList);
          oViewModel.setProperty('/listRowCount', iTableLength > 10 ? 10 : iTableLength);

          const aPartList = await this.getPartCascading();

          if (oViewModel.getProperty('/tab/selectedKey') === 'B') {
            this.setTeamGridList(aPartList);
          } else {
            aPartList.push({ Stext: this.getBundleText('MSG_15002') });
          }

          oViewModel.setProperty('/PartList', aPartList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 부문 선택
      onPartSelect(oEvent) {
        this.getViewModel().setProperty('/search/Orgtx', oEvent.getSource().getValue());
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

      // 수행 팀 목록 조회
      getTeamList(mSelectedRow = {}) {
        const oModel = this.getModel(ServiceNames.APPRAISAL);

        this.getViewModel().setProperty('/TeamList', []);

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingTeamListSet', {
            filters: [new sap.ui.model.Filter('Zyear', sap.ui.model.FilterOperator.EQ, mSelectedRow.Zyear), new sap.ui.model.Filter('Otype', sap.ui.model.FilterOperator.EQ, mSelectedRow.Otype), new sap.ui.model.Filter('Objid', sap.ui.model.FilterOperator.EQ, mSelectedRow.Objid)],
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
        const sDropPath = `${oDropped.getParent().getBindingContext().getPath()}/TmpGrid`;
        const aGridList = oViewModel.getProperty(sDropPath);
        let bInsertPosition = oInfo.getParameter('dropPosition') === 'Before';
        let iDropPosition = oGrid.indexOfItem(oDropped);

        // 빈 박스 드롭시
        if (!mDraggData.Ztext) {
          return;
        }

        // 부문 중복체크
        if (
          oDropped.sParentAggregationName !== oDragged.sParentAggregationName &&
          aGridList.some((e) => {
            return e === mDraggData;
          })
        ) {
          MessageBox.alert(this.getBundleText('MSG_15001'));
          return;
        }

        // remove the item
        const bDragIndex = oGrid.indexOfItem(oDragged) === -1;
        const iDragPosition = bDragIndex ? 0 : oGrid.indexOfItem(oDragged);

        if (!bDragIndex) {
          aGridList.splice(iDragPosition, 1);

          if (iDragPosition < iDropPosition && aGridList.length === iDropPosition) {
            iDropPosition--;
          }
        }

        mDraggData.Orgeh = oViewModel.getProperty(`${sDropPath}/0/Orgeh`);
        mDraggData.Orgtx = oViewModel.getProperty(`${sDropPath}/0/Orgtx`);

        // insert the control in target aggregation
        aGridList.splice(iDropPosition, bInsertPosition ? 0 : -1, mDraggData);
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
        let bInsertPosition = oInfo.getParameter('dropPosition') === 'Before';
        let iDropPosition = oGrid.indexOfItem(oDropped);

        // 빈 박스 드롭시
        if (!mDraggData.Objid) {
          return;
        }

        // 부문 중복체크
        if (
          oDropped.sParentAggregationName !== oDragged.sParentAggregationName &&
          aGridList.some((e) => {
            return e === mDraggData;
          })
        ) {
          MessageBox.alert(this.getBundleText('MSG_15001'));
          return;
        }

        // remove the item
        const bDragIndex = oGrid.indexOfItem(oDragged) === -1;
        const iDragPosition = bDragIndex ? 0 : oGrid.indexOfItem(oDragged);

        if (!bDragIndex) {
          aGridList.splice(iDragPosition, 1);

          if (iDragPosition < iDropPosition && aGridList.length === iDropPosition) {
            iDropPosition--;
          }
        }

        mDraggData.Orgeh = oViewModel.getProperty('/search/Orgeh');

        // insert the control in target aggregation
        aGridList.splice(iDropPosition, bInsertPosition ? 0 : -1, mDraggData);
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

        if (!oDraggedRowContext || !mDraggData.Objid) return;

        const aGridList = bTabKey ? oViewModel.getProperty('/PartList') : oViewModel.getProperty(sDraggPath.slice(0, sDraggPath.lastIndexOf('/')));
        const aPartList = aGridList.filter((x) => ![mDraggData].includes(x));

        // reset the rank property and update the model to refresh the bindings
        oViewModel.setProperty(bTabKey ? '/PartList' : sDraggPath, aPartList);
        oViewModel.refresh(true);
      },

      // table cascading조회
      getAllCascading() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oListModel = this.getViewModel();
        const oSearch = oListModel.getProperty('/search');

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingListSet', {
            filters: [new sap.ui.model.Filter('Gubun', sap.ui.model.FilterOperator.EQ, oListModel.getProperty('/tab/selectedKey')), new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oSearch.Werks), new sap.ui.model.Filter('Orgeh', sap.ui.model.FilterOperator.EQ, oSearch.Orgeh), new sap.ui.model.Filter('Zyear', sap.ui.model.FilterOperator.EQ, oSearch.Zyear)],
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

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingOrgListSet', {
            filters: [new sap.ui.model.Filter('Gubun', sap.ui.model.FilterOperator.EQ, oListModel.getProperty('/tab/selectedKey')), new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oSearch.Werks), new sap.ui.model.Filter('Orgeh', sap.ui.model.FilterOperator.EQ, sOrgeh || oSearch.Orgeh), new sap.ui.model.Filter('Zyear', sap.ui.model.FilterOperator.EQ, oSearch.Zyear)],
            success: (oData) => {
              if (oData) {
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

      // 팀 cascading grid settings
      setTeamGridList(aList = []) {
        const oViewModel = this.getViewModel();
        const sTempMessage = this.getBundleText('MSG_15002');

        oViewModel.setProperty(
          '/Tmp',
          _.chain(aList)
            .groupBy('Orgtx')
            .map((v, p) => ({ Label: p, TmpGrid: v }))
            .forEach((o) => o.TmpGrid.push({ Stext: sTempMessage }))
            .value()
        );
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

              const aList = [];
              const oViewModel = this.getViewModel();
              const aGridData = oViewModel.getProperty('/PartList');

              aGridData.forEach((e) => {
                if (!!e.Ztext) {
                  aList.push(e);
                }
              });

              const sTabKey = oViewModel.getProperty('/tab/selectedKey');
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
