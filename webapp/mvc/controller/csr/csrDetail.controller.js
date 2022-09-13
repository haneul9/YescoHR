sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/routing/History',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/common/FileAttachmentBoxHandler',
  ],
  (
    // prettier 방지용 주석
    History,
    MessageBox,
    Appno,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    BaseController,
    FileAttachmentBoxHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.csr.csrDetail', {
      PostcodeDialogHandler: null,

      initializeModel() {
        return {
          routeName: '',
          menid: this.getCurrentMenuId(),
          Austy: (this.isMss() ? 'M' : (this.isHass() ? 'H' : 'E')),
          previousName: History.getInstance().getPreviousHash(),
          Appno: '',
          Werks: '',
          Data: {Apcnt: '', Testc1: '', Testc2: ''},
          ApprovalData: [],
          ApprovalInfo: {rowCount: 0},
          busy: false,
          isNew: false,
          ButtonGroups: [
            {
              "name": "font-style",
              "visible": true,
              "row": 0,
              "priority": 10,
              "customToolbarPriority": 20,
              "buttons": [
                "bold",
                "italic",
                "underline",
                "strikethrough"
              ]
            },
            {
              "name": "text-align",
              "visible": true,
              "row": 0,
              "priority": 20,
              "customToolbarPriority": 30,
              "buttons": [
                "justifyleft",
                "justifycenter",
                "justifyright",
                "justifyfull"
              ]
            },
            {
              "name": "font",
              "visible": true,
              "row": 0,
              "priority": 30,
              "customToolbarPriority": 50,
              "buttons": [
                "fontselect",
                "fontsizeselect",
                "forecolor",
                "backcolor"
              ]
            },
            {
              "name": "clipboard",
              "visible": true,
              "row": 0,
              "priority": 10,
              "customToolbarPriority": 110,
              "buttons": [
                "cut",
                "copy",
                "paste"
              ]
            },
            {
              "name": "structure",
              "visible": true,
              "row": 0,
              "priority": 20,
              "customToolbarPriority": 60,
              "buttons": [
                "bullist",
                "numlist",
                "outdent",
                "indent"
              ]
            },
            {
              "name": "e-mail",
              "visible": false,
              "row": 0,
              "priority": 30,
              "customToolbarPriority": 10,
              "buttons": []
            },
            {
              "name": "undo",
              "visible": true,
              "row": 0,
              "priority": 40,
              "customToolbarPriority": 100,
              "buttons": [
                "undo",
                "redo"
              ]
            },
            {
              "name": "insert",
              "visible": true,
              "row": 0,
              "priority": 50,
              "customToolbarPriority": 80,
              "buttons": [
                "image",
                "emoticons"
              ]
            },
            {
              "name": "link",
              "visible": true,
              "row": 0,
              "priority": 60,
              "customToolbarPriority": 70,
              "buttons": [
                "link",
                "unlink"
              ]
            },
            {
              "name": "styleselect",
              "buttons": [
                "styleselect"
              ],
              "customToolbarPriority": 40,
              "visible": true,
              "priority": 10,
              "row": 0
            },
            {
              "name": "table",
              "buttons": [
                "table"
              ],
              "customToolbarPriority": 90,
              "visible": true,
              "priority": 10,
              "row": 0
            }
          ]
        };
      },

      // override AttachFileCode
      getApprovalType() {
        return 'CSR0';
      },

      async onObjectMatched(oParameter, sRouteName) {
        const sDataKey = oParameter.oDataKey;
        const sWerks = oParameter.werks;
        const oDetailModel = this.getViewModel();

        oDetailModel.setData(this.initializeModel());
        oDetailModel.setProperty('/Appno', sDataKey);
        oDetailModel.setProperty('/Werks', sWerks);
        oDetailModel.setProperty('/routeName', _.chain(sRouteName).split('-', 1).head().value());        
      },

      async onAfterShow(){
        const oDetailModel = this.getViewModel();
        oDetailModel.setProperty('/busy', true);

        try {
          await this.setFormData();
          this.settingsAttachTable();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // 이전화면
      onPreBack() {
        const oViewModel = this.getViewModel();
        let sRouteName = oViewModel.getProperty('/previousName');

        if (!sRouteName) {
          sRouteName = oViewModel.getProperty('/routeName');
        }

        this.getRouter().navTo(sRouteName);
      },

      editorReady(oEvent) {
        // oEvent.getSource().addButtonGroup('styleselect').addButtonGroup('table');
      },

      // FormData Settings
      async setFormData() {
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/Appno');
        const sWerks = oDetailModel.getProperty('/Werks');

        if (sAppno === 'N' || !sAppno) {
          oDetailModel.setProperty('/Data', {Prsta: '', Apcnt: '', Testc1: '', Testc2: '', Clsda: moment().hours(9).toDate()});
          oDetailModel.setProperty('/ApprovalData', []);
          oDetailModel.setProperty('/ApprovalInfo/rowCount', 1);
          oDetailModel.setProperty('/isNew', true);
        } else {
          oDetailModel.setProperty('/isNew', false);
          const oModel = this.getModel(ServiceNames.COMMON);
          const mData = await Client.getEntitySet(oModel, 'CsrRequest', {
            Appno: sAppno,
            Werks: sWerks
          });

          mData[0].Prgno = mData[0].Prgno.replace('\\n', '\n');
          mData[0].Ctsno = mData[0].Ctsno.replace('\\n', '\n');

          const mData2 = await Client.getEntitySet(oModel, 'CsrRequestApproval', {
            Appno: sAppno,
            Werks: sWerks,
          });

          var sEdit = '', mApprovalData = []; // 
          for(var i=0; i<mData2.length; i++){
            var tmp = $.extend(true, {}, mData2[i]);
            tmp.Idx = (i+1);
            
            if(sEdit == '' && !tmp.Datum && tmp.Uzeittx == '000000'){
              sEdit = 'X';
              tmp.Edit = true;
            } else {
              tmp.Edit = false;
            }

            mApprovalData.push(tmp);
          }
          // const mApprovalData = _.map(mData2, (o, i) => ({
          //   Idx: ++i,
          //   ...o,
          // }));

          // const mApprovalData = _.chain(mData2)
          // .cloneDeep()
          // .map((o,i) => {
          //   Idx: ++i,
          //   ...o,
          // })
          // .value();
console.log('결재현황 조회', mApprovalData)
          oDetailModel.setProperty('/Data', mData[0]);
          oDetailModel.setProperty('/ApprovalData', mApprovalData);
          oDetailModel.setProperty('/ApprovalInfo/rowCount', mApprovalData.length);
        }
      },

      // 유형 변경 시 결재현황 리스트 조회 후 세팅
      async onsetApprovalList(){
        const oDetailModel = this.getViewModel();

        if(!oDetailModel.getProperty('/Data/Csrty')){
          oDetailModel.setProperty('/ApprovalData', []);
          oDetailModel.setProperty('/ApprovalInfo/rowCount', 1);

          return;
        }

        const sPrsta = oDetailModel.getProperty('/Data/Prsta');
        const oModel = this.getModel(ServiceNames.COMMON);
        const mData = await Client.getEntitySet(oModel, 'CsrRequestApproval', {
          Prcty: 'A',
          Csrty: oDetailModel.getProperty('/Data/Csrty')
        });

        const mApprovalData = _.map(mData, (o, i) => ({
          Idx: ++i,
          ...o,
        }));
        console.log('결재리스트', mApprovalData);

        oDetailModel.setProperty('/ApprovalData', mApprovalData);
        oDetailModel.setProperty('/ApprovalInfo/rowCount', mApprovalData.length);
      },
      
      checkError(sAppType) {
        const oDetailModel = this.getViewModel();
        const mFormData = oDetailModel.getProperty('/Data');

        if (!mFormData.Apttl) {
          MessageBox.alert(this.getBundleText('MSG_46001')); // 제목을 입력하여 주십시오.
          return true;
        } else if (!mFormData.Csrty) {
          MessageBox.alert(this.getBundleText('MSG_46002')); // 유형을 선택하여 주십시오.
          return true;
        } else if (!mFormData.Clsda) {
          MessageBox.alert(this.getBundleText('MSG_46003')); // 완료희망일을 입력하여 주십시오.
          return true;
        } else if (!mFormData.Apcnt) {
          MessageBox.alert(this.getBundleText('MSG_46004')); // 내용을 입력하여 주십시오.
          return true;
        }

        return false;
      },

      onPressAccept(){
        this.onPressApprove('B');
      },
      
      onPressReject(){
        this.onPressApprove('C');
      },      

      // 신청
      onPressSave(vPrcty) {
        if(!vPrcty){
          vPrcty = "";
        }

        if (this.checkError('C')) return;

        const aText = {'': 'LABEL_00121', 'B': 'LABEL_00123', 'C': 'LABEL_00124'};

        // {신청|승인|반려}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', aText[vPrcty]), {
          // actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')], // 신청 취소
          onClose: async (vPress) => {                             
            if (vPress && vPress === 'OK') {
              try {
                AppUtils.setAppBusy(true);
  
                const oDetailModel = this.getViewModel();
                const mFormData = oDetailModel.getProperty('/Data');
  
                const sAppno = mFormData.Appno;
  
                if (!sAppno) {
                  const sAppno = await Appno.get();
  
                  oDetailModel.setProperty('/Data/Appno', sAppno);
                  oDetailModel.setProperty('/Data/Appdt', new Date());
                  oDetailModel.setProperty('/Data/Prsta', '10');
                  oDetailModel.setProperty('/Data/Prstg', '10');
                }
                
                // 첨부파일
                // await this.FileAttachmentBoxHandler.upload(mFormData.Appno);
  
                const mApprovalData = _.chain(oDetailModel.getProperty('/ApprovalData'))
                .cloneDeep()
                .map((o) => {
                  delete o.Idx;
                  delete o.__metadata;
      
                  return this.TimeUtils.convert2400Time(o);
                })
                .value()
  
                const oModel = this.getModel(ServiceNames.COMMON);
                const oSendObject = {
                  ...mFormData,
                  CsrRequest1Nav: mApprovalData,
                  Prcty: vPrcty
                };
                console.log(oSendObject)
                await Client.create(oModel, 'CsrRequest', oSendObject);
  
                MessageBox.alert(this.getBundleText('MSG_00007', aText[vPrcty]), { // {신청|승인|반려}되었습니다.
                  onClose: () => {
                    this.getRouter().navTo(oDetailModel.getProperty('/previousName'));
                  },
                });
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

      onPressApprove(vPrcty) {
        if(!vPrcty) return;

        const aText = {'B': 'LABEL_00123', 'C': 'LABEL_00124'};

        // {승인|반려}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', aText[vPrcty]), {
          onClose: async (vPress) => {                             
            if (vPress && vPress === 'OK') {
              try {
                AppUtils.setAppBusy(true);
  
                const oDetailModel = this.getViewModel();
                const mFormData = oDetailModel.getProperty('/Data');
                
                // 첨부파일
                // await this.FileAttachmentBoxHandler.upload(mFormData.Appno);

                const mApprovalData = _.find(oDetailModel.getProperty('/ApprovalData'), (o) => {
                    return o.Edit ;
                });
  
                const oModel = this.getModel(ServiceNames.COMMON);
                const oSendObject = {
                  Prcty: vPrcty,
                  Appno: mFormData.Appno,
                  Werks: mFormData.Werks,
                  Comnt: mApprovalData.Comnt
                };
                console.log(oSendObject)
                await Client.create(oModel, 'CsrRequestApproval', oSendObject);
  
                MessageBox.alert(this.getBundleText('MSG_00007', aText[vPrcty]), { // {승인|반려}되었습니다.
                  onClose: () => {
                    this.getRouter().navTo(oDetailModel.getProperty('/previousName'));
                  },
                });
              } catch (oError) {
                AppUtils.handleError(oError);  
              } finally {
                AppUtils.setAppBusy(false);
              }
            }
          },
        });
      },

      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/Data/Prsta');
        const sAppno = oViewModel.getProperty('/Data/Appno') || '';

        this.FileAttachmentBoxHandler = new FileAttachmentBoxHandler(this, {
          editable: sStatus === '' || oViewModel.getProperty('/Austy') === 'H',
          appno: sAppno,
          apptp: this.getApprovalType(),
          maxFileCount: 10,
          fileTypes: ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'txt', 'bmp', 'gif', 'png', 'pdf'],
        });
      },

      formatUzeittx(fVal){
        if(!fVal) return '';
        
        return fVal == '' || fVal == '000000' ? '' : (fVal.substring(0,2) + ':' + fVal.substring(2,4) + ':' + fVal.substring(4,6));
      }

    });
  }
);
