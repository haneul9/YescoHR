/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    "sap/ui/richtexteditor/RichTextEditor",
  ],
  (
    // prettier 방지용 주석
    JSONModel,
	Appno,
	AppUtils,
	AttachFileAction,
	ServiceNames,
	MessageBox,
	BaseController,
	RTE,
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.notice.NoticeDetail', {
      TYPE_CODE: 'HR02',

      AttachFileAction: AttachFileAction,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          ViewKey: '',
          MenId: '',
          Hass: this.isHass(),
          FormData: {},
          Settings: {},
          busy: false,
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_00167') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const oDetailModel = this.getViewModel();
        const sMenid = this.getCurrentMenuId();

        oDetailModel.setProperty('/ViewKey', sDataKey);
        oDetailModel.setProperty('/Menid', sMenid);

        this.setTextEditor();
        this.getTargetData();
        oDetailModel.setProperty('/busy', false);
      },

      // 중요항목 & 임시저장 Check
      onSelected(oEvent) {
        const bSelected = oEvent.getSource().getSelected();
        const sPath = oEvent.getSource().getBinding('selected').getBindings()[0].getPath();

        if (bSelected) {
          this.getViewModel().setProperty(sPath, 'X');
        } else {
          this.getViewModel().setProperty(sPath, '');
        }
      },

      // 상세조회
      getTargetData() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sViewKey = oDetailModel.getProperty('/ViewKey');
        const oSessionData = this.getSessionData();

        if (sViewKey === 'N' || !sViewKey) {
          oDetailModel.setProperty('/FormData', oSessionData);
          oDetailModel.setProperty('/FormData', {
            Apename: oSessionData.Ename,
            Appernr: oSessionData.Pernr,
            Zyear: String(new Date().getFullYear()),
          });

          this.settingsAttachTable();
        } else {
          let oSendObject = {};

          oSendObject.Prcty = '1';
          oSendObject.Menid = sMenid;
          oSendObject.Begda = dDate;
          oSendObject.Endda = dDate2;
          oSendObject.Werks = sWerks;
          oSendObject.Title = oSearch.title || '';
          oSendObject.Notice1Nav = [];
          oSendObject.Notice2Nav = [];

          oModel.create('/NoticeManageSet', oSendObject, {
            success: (oData) => {
              if (oData) {
                const oTargetData = oData.Notice1Nav.results[0];
                const oDetailData = oData.Notice2Nav.results;

                oTargetData.Detail = "";
						
                oDetailData.forEach(function(e) {
                  oTargetData.Detail += e.Detail;
                });

                oDetailModel.setProperty('/FormData', oTargetData);

                this.settingsAttachTable();
              }
            },
            error: (oError) => {
              AppUtils.handleError(oError);
            },
          });
        }
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');

        // 등록대상
        if (oFormData.Zzobjps === 'ALL' || !oFormData.Zzobjps) {
          MessageBox.alert(this.getBundleText('MSG_03007'));
          return true;
        }

        // 학력구분
        if (oFormData.Slart === 'ALL' || !oFormData.Slart) {
          MessageBox.alert(this.getBundleText('MSG_03008'));
          return true;
        }

        // 학년
        if (oFormData.Grdsp === 'ALL' || !oFormData.Grdsp) {
          MessageBox.alert(this.getBundleText('MSG_03009'));
          return true;
        }

        // 분기/학기
        if (oFormData.Divcd === 'ALL' || !oFormData.Divcd) {
          MessageBox.alert(this.getBundleText('MSG_03010'));
          return true;
        }

        // 학교명
        if (!oFormData.Schtx) {
          MessageBox.alert(this.getBundleText('MSG_03003'));
          return true;
        }

        // 수업료
        if (!oFormData.ZbetClass) {
          MessageBox.alert(this.getBundleText('MSG_03004'));
          return true;
        }

        return false;
      },

      // oData호출 mapping
      sendDataFormat(oDatas) {
        let oSendObject = {
          Appdt: oDatas.Appdt,
          Appno: oDatas.Appno,
          Apename: oDatas.Apename,
          Appernr: oDatas.Appernr,
          Cnttx: oDatas.Cnttx,
          Divcd: oDatas.Divcd,
          Forsch: oDatas.Forsch,
          Grdsp: oDatas.Grdsp,
          Majnm: oDatas.Majnm,
          Schtx: oDatas.Schtx,
          Slart: oDatas.Slart,
          Kdsvh: oDatas.Kdsvh,
          ZbetClass: oDatas.ZbetClass,
          ZbetEntr: oDatas.ZbetEntr,
          ZbetEtc: oDatas.ZbetEtc,
          ZbetExer: oDatas.ZbetExer,
          ZbetMgmt: oDatas.ZbetMgmt,
          ZbetShip: oDatas.ZbetShip,
          ZbetSuf: oDatas.ZbetSuf,
          ZbetTotl: oDatas.ZbetTotl,
          Znametx: oDatas.Znametx,
          Zname: oDatas.Zname,
          ZpayAmt: oDatas.ZpayAmt,
          Zyear: oDatas.Zyear,
          Zzjikcht: oDatas.Zzjikcht,
          Zzjikgbt: oDatas.Zzjikgbt,
          Zzjiktlt: oDatas.Zzjiktlt,
          Zzobjps: oDatas.Zzobjps,
        };

        return oSendObject;
      },

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          title: this.getBundleText('LABEL_08009'),
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sStatus || sStatus === '45') {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/Appdt', new Date());
                }

                let oSendObject = {};
                const oSendData = this.sendDataFormat(oFormData);
                const aDetail = [];
                
                oSendData.Detail.forEach(function(e) {
                  const mDetailObj = {};
                  mDetailObj.Detail = e;
                  aDetail.push(mDetailObj);
                });

                oSendObject.Prcty = '2';
                oSendObject.Menid = oDetailModel.getProperty('/Menid');
                oSendObject.Notice1Nav = [oSendData];
                oSendObject.Notice2Nav = aDetail;


                 // 첨부파일
                if (!AttachFileAction.getFileLength.call(this)) {
                  // FileUpload
                  await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE);
                }

                await new Promise((resolve, reject) => {
                  oModel.create('/SchExpenseApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(oError);
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
              } catch (oError) {
                AppUtils.handleError(oError);
              } finally {
                AppUtils.setAppBusy(false, this);
              }
            }
          },
        });
      },

      // 등록
      onRegistBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError('O')) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00106'), {
          title: this.getBundleText('LABEL_08009'),
          actions: [this.getBundleText('LABEL_00106'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00106')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sStatus || sStatus === '45') {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/Appdt', new Date());
                }

                let oSendObject = {};
                const oSendData = this.sendDataFormat(oFormData);

                oSendObject = oSendData;
                oSendObject.Prcty = 'C';
                oSendObject.Menid = oDetailModel.getProperty('/Menid');
                oSendObject.Waers = 'KRW';

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE);

                await new Promise((resolve, reject) => {
                  oModel.create('/SchExpenseApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(oError);
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00106'), {
                  onClose: () => {
                    this.getRouter().navTo('notice');
                  },
                });
              } catch (error) {
                AppUtils.handleError(error);
              } finally {
                AppUtils.setAppBusy(false, this);
              }
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          title: this.getBundleText('LABEL_08009'),
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              AppUtils.setAppBusy(true, this);

              const sPath = oModel.createKey('/SchExpenseApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });

              oModel.remove(sPath, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      this.getRouter().navTo('notice');
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(oError);
                  AppUtils.setAppBusy(false, this);
                },
              });
            }
          },
        });
      },

      setTextEditor() {
        if(this.byId("myRTE")) {
          this.byId("myRTE").destroy();
        }
  
        var that = this;
        that.oRichTextEditor = new RTE("myRTE", {
          editorType: 'TinyMCE4',
          layoutData: new sap.m.FlexItemData({ growFactor: 1 }),
          // width: "100%",
          height: "500px",
          customToolbar: true,
          showGroupFont: true,
          showGroupInsert: true,
          sanitizeValue: false,
          value: "{/FormData/Detail}",
          editable: {
            path: "/FormData/ZappStatAl",
            formatter: (v1) => {
              return !v1 || v1 === '10';
            }
          },
          ready: function () {
            this.addButtonGroup("styleselect").addButtonGroup("table");
          }
        });
  
        this.byId("EditorBox").addItem(that.oRichTextEditor);
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10',
          Type: this.TYPE_CODE,
          Appno: sAppno,
          Message: this.getBundleText('MSG_00040'),
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
