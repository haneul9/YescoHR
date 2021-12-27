sap.ui.define([
	// prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    "sap/ui/core/dnd/DragInfo",
	"sap/ui/core/dnd/DropInfo",
	"sap/ui/core/dnd/DropPosition",
	"sap/ui/core/dnd/DropLayout",
	"sap/f/dnd/GridDropInfo",
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/mvc/controller/BaseController',
], function(
	JSONModel,
	DragInfo,
	DropInfo,
	DropPosition,
	DropLayout,
	GridDropInfo,
	MessageBox,
	AppUtils,
	FragmentEvent,
	TableUtils,
	TextUtils,
	ServiceNames,
	ODataReadError,
	BaseController
) {
	"use strict";

	return BaseController.extend("sap.ui.yesco.mvc.controller.mssEvalKpi.Kpi", {
        onBeforeShow() {
            const oViewModel = new JSONModel({
                busy: false,
                List: [],
                Years: [],
                TeamList: [],
                PartCode: [],
                CompanyCode: [],
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
                this.getPartCascading();
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
                    filters: [
                        new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, sWerks),
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

        // 평가년도 setting
        setYears(iYear = new Date().getFullYear()) {
            const oViewModel = this.getViewModel();
            const aYearsList = [];

            aYearsList.push(
                { Zcode: String(iYear), Ztext: `${iYear}년` }, 
                { Zcode: String(iYear - 1), Ztext: `${iYear - 1}년` }
            );

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

            this.getAllCascading();
            this.getPartCascading();
        },

        // 회사선택
        async onCompSelect(oEvent) {            
            const oViewModel = this.getViewModel();
            const aPartList = await this.partList(oEvent.getSource().getSelectedKey());
                
            oViewModel.setProperty('/PartCode', aPartList);
            oViewModel.setProperty('/search/Orgeh', !!aPartList.length ? aPartList[0].Orgeh : '');
            oViewModel.setProperty('/search/Orgtx', !!aPartList.length ? aPartList[0].Orgtx : '');
        },

        onSearch() {
            this.getAllCascading();
            this.getPartCascading();
        },
        
        // 부문 선택
        onPartSelect(oEvent) {
            this.getViewModel().setProperty('/search/Orgtx', oEvent.getSource().getValue());
        },

        // 수행 팀 수 Link Press
        async onPressTeam(oEvent) {
            try {
                const sPath = oEvent.getSource().getBindingContext().getPath();
                const oViewModel = this.getViewModel();
                const aList = await this.getTeamList(oViewModel.getProperty(sPath));

                oViewModel.setProperty('/TeamList', aList);
                
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
            oEvent.getSource().close();
        },

        // 수행 팀 목록 조회
        getTeamList(mSelectedRow = {}) {
            const oModel = this.getModel(ServiceNames.APPRAISAL);

            this.getViewModel().setProperty('/TeamList', []);

            return new Promise((resolve, reject) => {
                oModel.read('/KpiCascadingOrgehSet', {
                    filters: [
                        new sap.ui.model.Filter('Zyear', sap.ui.model.FilterOperator.EQ, mSelectedRow.Zyear),
                        new sap.ui.model.Filter('Otype', sap.ui.model.FilterOperator.EQ, mSelectedRow.Otype),
                        new sap.ui.model.Filter('Objid', sap.ui.model.FilterOperator.EQ, mSelectedRow.Objid),
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

        onDrop(oInfo) {
			const oViewModel = this.getViewModel();
			const oDragged = oInfo.getParameter("draggedControl");
            const oDropped = oInfo.getParameter("droppedControl");
            const oDraggPath = oDragged.getBindingContext().getPath();
            const sInsertPosition = oInfo.getParameter("dropPosition");
            const oGrid = oDropped.getParent();
			const mDraggData = oViewModel.getProperty(oDraggPath);
            const aGridList = oViewModel.getProperty('/PartList');
            const iDropPosition = oGrid.indexOfItem(oDropped);

            // 부문 중복체크
            if (oDropped === oDragged && aGridList.some((e) => {return e === mDraggData})) {
                return;
            }

            // remove the item
            const iDragPosition = oGrid.indexOfItem(oDragged) || 0;
			const oItem = aGridList[iDragPosition];
            
			aGridList.splice(iDragPosition, 1);

			if (iDragPosition < iDropPosition) {
				iDropPosition--;
			}

            // insert the control in target aggregation
			if (sInsertPosition === "Before") {
				aGridList.splice(iDropPosition, 0, oItem);
			} else {
				aGridList.splice(iDropPosition + 1, 0, oItem);
			}

			oViewModel.setProperty("/PartList", aGridList);

            // oViewModel.setProperty('/PartList', [mDraggData, ...aGridList]);
		},

        // table rowData Drag
        onDragStart(oEvent) {
            const oDraggedRow = oEvent.getParameter("target");
			const oDragSession = oEvent.getParameter("dragSession");

			// keep the dragged row context for the drop action
			oDragSession.setComplexData("draggedRowContext", oDraggedRow.getBindingContext());
        },

        // DropEvent
        onDropTable(oEvent) {
            const oDragSession = oEvent.getParameter("dragSession");
			const oDraggedRowContext = oDragSession.getComplexData("draggedRowContext");

			if (!oDraggedRowContext) return;

            const oViewModel = this.getViewModel();
            const aPartList = oViewModel.getProperty('/PartList').filter(x => ![oViewModel.getProperty(oDraggedRowContext.getPath())].includes(x));
            
			// reset the rank property and update the model to refresh the bindings
			oViewModel.setProperty('/PartList', aPartList);
			oViewModel.refresh(true);
        },

        // 전사 cascading조회
        getAllCascading() {
            const oModel = this.getModel(ServiceNames.APPRAISAL);
            const oListModel = this.getViewModel();
            const oSearch = oListModel.getProperty('/search');

            oListModel.setProperty('/busy', true);

            oModel.read('/KpiCascadingListSet', {
                filters: [
                    new sap.ui.model.Filter('Gubun', sap.ui.model.FilterOperator.EQ, oListModel.getProperty('/tab/selectedKey')),
                    new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oSearch.Werks),
                    new sap.ui.model.Filter('Orgeh', sap.ui.model.FilterOperator.EQ, oSearch.Orgeh),
                    new sap.ui.model.Filter('Zyear', sap.ui.model.FilterOperator.EQ, oSearch.Zyear),
                ],
                success: (oData) => {
                    if (oData) {
                        const oList = oData.results;

                        oListModel.setProperty('/List', oList);
                        oListModel.setProperty('/listRowCount', oList.length > 10 ? 10 : oList.length);
                        oListModel.setProperty('/busy', false);
                    }
                },
                error: (oError) => {
                    this.debug(oError);
                    AppUtils.handleError(new ODataReadError(oError));
                    oListModel.setProperty('/busy', false);
                },
            });
        },

        // 부문 cascading조회
        getPartCascading(sOrgeh = '') {
            const oModel = this.getModel(ServiceNames.APPRAISAL);
            const oListModel = this.getViewModel();
            const oSearch = oListModel.getProperty('/search');

            oListModel.setProperty('/busy', true);            

            oModel.read('/KpiCascadingOrgListSet', {
                filters: [
                    new sap.ui.model.Filter('Gubun', sap.ui.model.FilterOperator.EQ, oListModel.getProperty('/tab/selectedKey')),
                    new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oSearch.Werks),
                    new sap.ui.model.Filter('Orgeh', sap.ui.model.FilterOperator.EQ, sOrgeh || oSearch.Orgeh),
                    new sap.ui.model.Filter('Zyear', sap.ui.model.FilterOperator.EQ, oSearch.Zyear),
                ],
                success: (oData) => {
                    if (oData) {
                        const oList = oData.results;

                        oListModel.setProperty('/PartList', oList);
                        oListModel.setProperty('/busy', false);
                    }
                },
                error: (oError) => {
                    this.debug(oError);
                    AppUtils.handleError(new ODataReadError(oError));
                    oListModel.setProperty('/busy', false);
                },
            });
        },
	});
});