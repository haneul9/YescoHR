sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/control/MessageBox',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController,
    MessageBox
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.csr.csr', {
      initializeModel() {
        return {
          busy: false,
          routeName: '',
          Austy: (this.isMss() ? 'M' : (this.isHass() ? 'H' : 'E')),
          search: {
            Werks: this.getAppointeeProperty('Werks'),
            date: moment().hours(9).toDate(),
            secondDate: moment().subtract(1, 'months').add(1, 'days').hours(9).toDate(),
            Schty: 'X'
          },
          listInfo: {
            Title: this.getBundleText("LABEL_46016"), // 상세내역
            isShowProgress: false,
            isShowApply: true,
            isShowApprove: true,
            isShowReject: false,
            isShowComplete: true,
            ObjTxt2: this.getBundleText('LABEL_46001'), // 신청단계
            ObjTxt3: this.getBundleText('LABEL_46002'), // 처리단계
            ObjTxt5: this.getBundleText('LABEL_46003'), // 완료단계
            rowCount: 3,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
          List: [],
          SelectedRows: []
        };
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);
          oListModel.setProperty('/routeName', sRouteName);

          // await this.readList();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          // this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
          oListModel.setProperty('/busy', false);
        }
      },

      async onBeforeShow(){
        const oListModel = this.getViewModel();

        try{
          oListModel.setProperty('/busy', true);
          await this.readList();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
        
      },

      async callbackAppointeeChange() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          await this.readList();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onClick() {
        const sRouteName = this.getViewModel().getProperty('/routeName');
        const sWerks = this.getViewModel().getProperty('/search/Werks');

        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: 'N', werks: sWerks });
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          await this.readList();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      async readList() {
        const oListModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.COMMON);
          const oSearch = oListModel.getProperty('/search');

          const aTableList = await Client.getEntitySet(oModel, 'CsrRequest', {
            Austy: oListModel.getProperty('/Austy'),
            Werks: oSearch.Werks,
            Begda: moment(oSearch.secondDate).hours(9).toDate(),
            Endda: moment(oSearch.date).hours(9).toDate(),
            Schty: (oListModel.getProperty('/Austy') == 'M' ? (oSearch.Schty == 'A' ? '' : oSearch.Schty) : '') // CSR결재: 조회구분
          });

          oListModel.setProperty('/List', aTableList);

          const iVisibleRowCountLimit = this.TableUtils.calculateVisibleRowCount(this.byId('Table'));
          const iDataLength = aTableList.length;
          const oOccurCount = _.chain(aTableList)
            .map('Prstg')
            .countBy()
            .defaults({
              ['']: 0,
              ['10']: 0,
              ['20']: 0,
              ['30']: 0
            })
            .value();
          
          oListModel.setProperty('/listInfo', {
            // rowCount: Math.min(iVisibleRowCountLimit, iDataLength),
            rowCount: iDataLength,
            totalCount: aTableList.length,
            applyCount: oOccurCount['10'],
            approveCount: oOccurCount['20'],
            completeCount: oOccurCount['30'],
            Title: this.getBundleText("LABEL_46016"), // 상세내역
            isShowProgress: false,
            isShowApply: true,
            isShowApprove: true,
            isShowReject: false,
            isShowComplete: true,
            ObjTxt2: this.getBundleText('LABEL_46001'), // 신청단계
            ObjTxt3: this.getBundleText('LABEL_46002'), // 처리단계
            ObjTxt5: this.getBundleText('LABEL_46003'), // 완료단계
          });

          oListModel.setProperty('/SelectedRows', []);
        } catch (oError) {
          throw oError;
        } finally {
          if(oListModel.getProperty('/Austy') === 'M'){
            this.setTableStyle();
          }          
        }
      },

      onSelectionTable(oEvent) {
        const oViewModel = this.getViewModel();
        const oTable = oEvent.getSource();
        const aList = oViewModel.getProperty('/List');

        if (oEvent.getParameter('selectAll') === true) {
          _.forEach(aList, (o, i) => {
            if (o.Appryn === '') oTable.removeSelectionInterval(i, i);
          });
        }

        const aSelectedIndices = oTable.getSelectedIndices();

        _.forEach(aList, (o, i) => _.set(o, 'Checked', _.includes(aSelectedIndices, i)));
        oViewModel.refresh();

        this.setTableStyle();

        const aMappedIndices = oTable.getBindingInfo('rows').binding.aIndices;

        oViewModel.setProperty(
          '/SelectedRows',
          _.map(aSelectedIndices, (e) => {
            return oViewModel.getProperty(`/List/${aMappedIndices[e]}`);
          })
        );
      },

      setTableStyle() {
        setTimeout(() => {
          const oTable = this.byId('Table');
          const sTableId = oTable.getId();

          oTable.getRows().forEach((row, i) => {
            const mRowData = row.getBindingContext().getObject();
            if (mRowData.Appryn === 'X') {
              $(`#${sTableId}-rowsel${i}`).removeClass('disabled-table-selection');
            } else {
              $(`#${sTableId}-rowsel${i}`).addClass('disabled-table-selection');              
            }
          });
        }, 100);
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);
        const sRouteName = oListModel.getProperty('/routeName');

        oListModel.setProperty('/parameters', oRowData);
        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: oRowData.Appno, werks: oRowData.Werks });
      },

      onPressAccept(){
        this.onSave('B');
      },

      onPressReject(){
        this.onSave('C');
      },

      async onSave(vPrcty){
        const oViewModel = this.getViewModel();
        const mData = oViewModel.getProperty('/SelectedRows');

        if(mData.length === 0){
          MessageBox.alert(this.getBundleText('MSG_46005')); // 데이터를 선택하여 주십시오.
          return;
        }

        const sMessage = vPrcty === 'B' ? 'LABEL_00123' : 'LABEL_00124';

        // {승인|반려}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', sMessage), {
          onClose: async (vPress) => {
            if (vPress && vPress === 'OK') {
              try {
                AppUtils.setAppBusy(true);

                await this.onProcess(mData, vPrcty, sMessage);
  
                // const mApprovalData = _.chain(mData)
                // .cloneDeep()
                // .map((o) => {
                //   delete o.__metadata;
      
                //   return this.TimeUtils.convert2400Time(o);
                // })
                // .value();
                
  //               const oModel = this.getModel(ServiceNames.COMMON);
  //               const oSendObject = {
  //                 ...mFormData,
  //                 CsrRequest1Nav: mApprovalData
  //               };
  //               await Client.create(oModel, 'CsrRequestApproval', oSendObject);
  
              } catch (oError) {
                AppUtils.handleError(oError);
  
                if(oDetailModel.getProperty('/isNew') === true){
                  oDetailModel.setProperty('/Data/Prsta', '');
                  oDetailModel.setProperty('/Data/Prstg', '');
                }
  
              } finally {
                AppUtils.setAppBusy(false);
              }
            }
          },
        });
      },

      async onProcess(mData, vPrcty, sMessage){

        const oModel = this.getModel(ServiceNames.COMMON);
        try {
          _.map(mData, async (e) => {
            e.Prcty = vPrcty;
            await Client.create(oModel, 'CsrRequestApproval', e);
          });

           // {승인|반려}되었습니다.
           MessageBox.alert(this.getBundleText('MSG_00007', sMessage), {
            onClose: () => {
              this.onSearch();
              this.byId('Table').clearSelection();
            },
          });
        } catch(oError){
          AppUtils.handleError(oError);
        }

      },

      onPressExcelDownload() {
        const oTable = this.byId('Table');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_46000'); // CSR_목록

        this.TableUtils.export({ oTable, sFileName });
      },

      rowHighlight(sValue) {
        const vValue = !parseInt(sValue, 10) ? sValue : parseInt(sValue, 10);

        switch (vValue) {
          case 10:
            // 신청
            return sap.ui.core.IndicationColor.Indication03;
          case 20:
            // 승인
            return sap.ui.core.IndicationColor.Indication04;
          case 30:
            // 완료
            return sap.ui.core.IndicationColor.Indication05;
          default:
            return null;
        }
      },

    });
  }
);
