sap.ui.define([
	// prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/mvc/controller/BaseController',
], function(
	JSONModel,
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
            PartCode: [],
            CompanyCode: [],
            tab: {
                selectedKey: '',
            },
            search: {
                WerksL: '',
                OrgehL: '',
                ZyearL: '',
            },
            listInfo: {
                rowCount: 1,
                totalCount: 0,
                progressCount: 0,
                applyCount: 0,
                approveCount: 0,
                rejectCount: 0,
                completeCount: 0,
            },
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
                    Orgeh: oSessionData.Orgeh,
                    Zyear: String(new Date().getFullYear()),
                });
                this.onSearch();
            } catch (oError) {
                AppUtils.handleError();
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

			// reset the rank property and update the model to refresh the bindings
			// this.oProductsModel.setProperty("Rank", this.config.initialRank, oDraggedRowContext);
			// this.oProductsModel.refresh(true);
        },

        // 회사선택
        onCompSelect(oEvent) {
            this.partList(oEvent.getSource().getSelectedKey());
        },

        onSearch() {
            const oModel = this.getModel(ServiceNames.APPRAISAL);
            const oListModel = this.getViewModel();
            const oTable = this.byId('gridTable');
            const oSearch = oListModel.getProperty('/search');

            oListModel.setProperty('/busy', true);

            oModel.read('/KpiCascadingListSet', {
                filters: [
                    new sap.ui.model.Filter('Gubun', sap.ui.model.FilterOperator.EQ, 'A'),
                    new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oSearch.Werks),
                    new sap.ui.model.Filter('Orgeh', sap.ui.model.FilterOperator.EQ, oSearch.Orgeh),
                    new sap.ui.model.Filter('Zyear', sap.ui.model.FilterOperator.EQ, oSearch.Zyear),
                ],
                success: (oData) => {
                    if (oData) {
                    const oList = oData.results;

                    oListModel.setProperty('/List', oList);
                    oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: oList, sStatCode: 'Lnsta' }));
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