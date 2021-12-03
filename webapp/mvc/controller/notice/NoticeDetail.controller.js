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
      LIST_PAGE_ID: 'container-ehr---notice',

      AttachFileAction: AttachFileAction,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          ViewKey: '',
          MenId: '',
          MySelf: false,
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
        const oModel = this.getModel(ServiceNames.COMMON);
        const oDetailModel = this.getViewModel();
        const sViewKey = oDetailModel.getProperty('/ViewKey');
        const oSessionData = this.getSessionData();

        if (sViewKey === 'N') {
          oDetailModel.setProperty('/MySelf', true);
          oDetailModel.setProperty('/FormData', oSessionData);
          oDetailModel.setProperty('/FormData', {
            ApernTxt: `${oSessionData.Orgtx} ${oSessionData.Ename}`,
            Apern: oSessionData.Pernr,
          });

          this.settingsAttachTable();
        } else {
          const oView = this.getView();
          const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
          const mListData = oListView.getModel().getProperty('/parameter');
          const sWerks = this.getSessionProperty('Werks');
          let oSendObject = {};

          oSendObject.Prcty = '1';
          oSendObject.Sdate = mListData.Sdate;
          oSendObject.Seqnr = mListData.Seqnr;
          oSendObject.Werks = sWerks;
          oSendObject.Notice1Nav = [];
          oSendObject.Notice2Nav = [];

          oModel.create('/NoticeManageSet', oSendObject, {
            success: (oData) => {
              if (oData) {
                const oTargetData = oData.Notice1Nav.results[0];
                const oDetailData = oData.Notice2Nav.results;

                if(this.getSessionProperty('Pernr') === oTargetData.Apern) {
                  oDetailModel.setProperty('/MySelf', true);
                }

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

        // 제목
        if (!oFormData.Title) {
          MessageBox.alert(this.getBundleText('MSG_08001'));
          return true;
        }

        // 내용
        if (!oFormData.Detail) {
          MessageBox.alert(this.getBundleText('MSG_08002'));
          return true;
        }

        return false;
      },

      // oData호출 mapping
      sendDataFormat(oDatas) {
        let oSendObject = {
          Sdate: oDatas.Sdate,
          Seqnr: oDatas.Seqnr,
          Title: oDatas.Title,
          Detail: oDatas.Detail,
          Apern: oDatas.Apern,
          ApernTxt: oDatas.ApernTxt,
          Impor: oDatas.Impor,
          Hide: oDatas.Hide,
          Aedtm: oDatas.Aedtm,
          Aetim: oDatas.Aetim,
          Appno: oDatas.Appno,
          Newitem: oDatas.Newitem,
        };

        return oSendObject;
      },

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.COMMON);
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/FormData/Appno');
        const oFormData = oDetailModel.getProperty('/FormData');
        const sWerks = this.getSessionProperty('Werks');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          title: this.getBundleText('LABEL_08009'),
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sAppno) {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/Sdate', new Date());
                }

                let oSendObject = {};
                const oSendData = this.sendDataFormat(oFormData);
                const aDetail = [];
                const aList = oSendData.Detail.match(new RegExp('.{1,' + 4000 + '}', 'g'));
                
                aList.forEach(function(e) {
                  const mDetailObj = {};

                  mDetailObj.Detail = e;
                  aDetail.push(mDetailObj);
                });

                oSendData.Detail = '';
                oSendObject.Prcty = '2';
                oSendObject.Werks = sWerks;
                oSendObject.Notice1Nav = [oSendData];
                oSendObject.Notice2Nav = aDetail;

                 // 첨부파일
                if (!!AttachFileAction.getFileLength.call(this)) {
                  // FileUpload
                  await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE);
                }

                await new Promise((resolve, reject) => {
                  oModel.create('/NoticeManageSet', oSendObject, {
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
        const oModel = this.getModel(ServiceNames.COMMON);
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/FormData/Appno');
        const oFormData = oDetailModel.getProperty('/FormData');
        const sWerks = this.getSessionProperty('Werks');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00106'), {
          title: this.getBundleText('LABEL_08009'),
          actions: [this.getBundleText('LABEL_00106'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00106')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sAppno) {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/Sdate', new Date());
                }

                let oSendObject = {};
                const oSendData = this.sendDataFormat(oFormData);
                const aDetail = [];
                const aList = oSendData.Detail.match(new RegExp('.{1,' + 4000 + '}', 'g'));
                
                aList.forEach(function(e) {
                  const mDetailObj = {};

                  mDetailObj.Detail = e;
                  aDetail.push(mDetailObj);
                });
                
                oSendData.Detail = '';
                oSendObject.Prcty = '2';
                oSendObject.Werks = sWerks;
                oSendObject.Notice1Nav = [oSendData];
                oSendObject.Notice2Nav = aDetail;

                // 첨부파일
                if (!!AttachFileAction.getFileLength.call(this)) {
                  // FileUpload
                  await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE);
                }

                await new Promise((resolve, reject) => {
                  oModel.create('/NoticeManageSet', oSendObject, {
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
                    let sPageName = '';

                    if (this.Hass()) {
                      sPageName = 'noticeHass';
                    } else {
                      sPageName = 'notice';
                    }

                    this.getRouter().navTo(sPageName);
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
        const oModel = this.getModel(ServiceNames.COMMON);

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          title: this.getBundleText('LABEL_08009'),
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              AppUtils.setAppBusy(true, this);

              let oSendObject = {};
              const oSendData = this.sendDataFormat(oFormData);
              const aDetail = [];
              
              oSendData.Detail.forEach(function(e) {
                const mDetailObj = {};

                mDetailObj.Detail = e;
                aDetail.push(mDetailObj);
              });

              oSendObject.Prcty = '3';
              oSendObject.Notice1Nav = [oSendData];
              oSendObject.Notice2Nav = aDetail;

              oModel.create('/NoticeManageSet', oSendObject, {
                success: () => {
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      let sPageName = '';
  
                      if (this.Hass()) {
                        sPageName = 'noticeHass';
                      } else {
                        sPageName = 'notice';
                      }
  
                      this.getRouter().navTo(sPageName);
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(oError);
                },
              });
            }
          },
        });
      },

      setTextEditor() {
        if(!!this.byId("myRTE")) {
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
            parts: [{path: "/FormData/Appno"}, {path: '/Hass'}],
            formatter: (v1, v2) => {
              return !v1 && !!v2;
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
