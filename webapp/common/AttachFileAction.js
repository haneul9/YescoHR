/* eslint-disable quote-props */
sap.ui.define(
    [
      'sap/m/MessageBox',
      'sap/ui/yesco/common/AppUtils',
      'sap/ui/core/UIComponent',
    ],
    (
        MessageBox,
        AppUtils,
        UIComponent,
    ) => {
        'use strict';

        return {
            /*
            * 첨부파일의 Upload가 완료되었을때 처리 내역
            * refreshAttachFileList Function을 호출한다.
            */
            uploadComplete(oEvent) {
                const sResponse = oEvent.getParameter("response");
                // const oFileUploader = oController.byId([this.PAGEID, "ATTACHFILE_BTN"].join(this.SEQ || "_"));

                sap.m.MessageBox.alert(sResponse, { title: "안내" });

                // oFileUploader.setValue("");

                // common.AttachFileAction.refreshAttachFileList(this);
            },

            /*
            * Upload할 첨부파일을 선택했을 경우 처리 내역
            */
            onFileChange(oEvent) {
                const oAttachbox = this.byId("ATTACHBOX");
                const oFileUploader = this.byId("ATTACHFILE_BTN");
                // const f1 = document.getElementById("ATTACHFILE_BTN-fu_input-inner");
                const JSonModel = oAttachbox.getModel();
                const aFileList = [];
                const vMode = JSonModel.getProperty("/Settings/Mode");
                const vMax = JSonModel.getProperty("/Settings/Max");
                const files = oEvent.getParameters().files;
                let vFileData = JSonModel.getProperty("/Data");

                if(!vFileData) {
                    JSonModel.setProperty("/Data", []);
                    vFileData = JSonModel.getProperty("/Data");
                }

                if (files) {
                    vFileData.forEach(function(elem) {
                        aFileList.push(elem);
                    });

                    if(vMode === "M" && (vFileData.length + files.length) > vMax) {
                        oFileUploader.clear();
                        oFileUploader.setValue("");
                        // if (f1) f1.setAttribute("value", "");

                        sap.m.MessageToast.show(this.getBundleText("MSG_00036").interpolate(vMax), { my: "center center", at: "center center"});

                        return;
                    }

                    for (let i = 0; i < files.length; i++) {
                        files[i].New = true;
                        files[i].Fname = files[i].name;
                        files[i].Type = files[i].type;

                        aFileList.push(files[i]);
                    }

                    JSonModel.setProperty("/Settings/Length", aFileList.length);
                    JSonModel.setProperty("/Data", aFileList);
                }

                oFileUploader.clear();
                oFileUploader.setValue("");
                // if (f1) f1.setAttribute("value", "");

                // if(typeof AttachFileAction.fnChange === "function") AttachFileAction.fnChange.call(this);
            },

            /*
            * 첨부파일 리스트를 Binding한다.
            */
            refreshAttachFileList(oController, vAppno, vType) {
                // const f1 = document.getElementById("ATTACHFILE_BTN-fu_input-inner");
                const oAttachbox = oController.byId("ATTACHBOX");
                const oAttachFileList = oController.byId("attachTable");
                const oFileUploader = oController.byId("ATTACHFILE_BTN");
                const oModel = oController.getModel('common');
                const JSonModel = oAttachbox.getViewModel();
                const vAttachFileDatas = JSonModel.getProperty("/Data");
                const vAsync = JSonModel.getProperty("/Settings/ReadAsync");
                const Datas = { Data: [] };

                JSonModel.setProperty("/Settings/Length", 0);
                JSonModel.setProperty("/Data", []);

                // if(!vAppnm) {
                //     if(typeof common.AttachFileAction.fnRetrieveCallback === "function") common.AttachFileAction.fnRetrieveCallback.call(this);
                //     return;
                // }

                oAttachbox.setBusyIndicatorDelay(0).setBusy(true);

                // if (f1) f1.setAttribute("value", "");

                oFileUploader.clear();
                oFileUploader.setValue("");
                oAttachFileList.removeSelections(true);

                oModel.read("/FileListSet", {
                    async: vAsync || false,
                    filters: [
                        new sap.ui.model.Filter("Appnm", sap.ui.model.FilterOperator.EQ, vType),
                        new sap.ui.model.Filter("Appno", sap.ui.model.FilterOperator.EQ, vAppno)
                    ],
                    success: function (data) {
                        if (data && data.results.length) {
                            data.results.forEach(function (elem) {
                                elem.New = false;
                                elem.Type = elem.Fname.substring(elem.Fname.lastIndexOf(".") + 1);
                                elem.Url = elem.Url.replace(/retriveScpAttach/, "retriveAttach");
                                elem.Mresource_convert = "data:${mimetype};base64,${resource}".interpolate(elem.Mimetype, elem.Mresource);

                                Datas.Data.push(elem);
                            });
                        }

                        // DB저장 전 올린 File List 를 배열에 담는다. ( 이후에 DB에 저장 된 File List 와 결합하여 보여줌 )
                        // if (vExistDataFlag == "X" && vAttachFileDatas) {
                        //     vAttachFileDatas.forEach(function (elem) {
                        //         if(elem.New === true) Datas.Data.push(elem);
                        //     });
                        // }

                        JSonModel.setProperty("/Settings/Length", Datas.Data.length);
                        JSonModel.setProperty("/Data", Datas.Data);

                        oAttachbox.setBusy(false);
                        // if(typeof common.AttachFileAction.fnRetrieveCallback === "function") common.AttachFileAction.fnRetrieveCallback.call(this);
                    },
                    error: function (res) {
                        common.Common.log(res);
                        oAttachbox.setBusy(false);
                        // if(typeof common.AttachFileAction.fnRetrieveCallback === "function") common.AttachFileAction.fnRetrieveCallback.call(this);
                    }
                })
            },

            uploadFile(Appno, Type) {
                // const oModel = this.getModel('common');
                const sServiceUrl = AppUtils.getServiceUrl('ZHR_COMMON_SRV', this.getOwnerComponent());
                const oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true, undefined, undefined, undefined, undefined, undefined, false);
                const Attachbox = this.byId("ATTACHBOX");
                const vAttachDatas = Attachbox.getModel().getProperty("/Data") || [];
                const aDeleteFiles = Attachbox.getModel().getProperty("/DelelteDatas") || [];
        
                try {
                    const _handleSuccess = function (data) {                        
                        common.Common.log("파일 업로드를 완료하였습니다." + ", " + data);
                    };
                    const _handleError = function (data) {
                        const errorMsg = "파일 업로드에 실패하였습니다.";
        
                        common.Common.log("Error: " + data);
                        sap.m.MessageToast.show(errorMsg, { my: "center center", at: "center center"});
                    };
        
                    // 파일 삭제
                    if(aDeleteFiles.length) {
                        const bDeleteFlag = true;
                        aDeleteFiles.some(function(elem) {
                            bDeleteFlag = common.AttachFileAction.callDeleteFileService(elem);
        
                            return !bDeleteFlag;
                        });
        
                        if(!bDeleteFlag) {
                            sap.m.MessageToast.show("파일 업로드에 실패하였습니다.", { my: "center center", at: "center center"});
                            return;
                        }
                    }
        
                    // 신규 등록된 파일만 업로드
                    if (!vAttachDatas) return;
        
                    vAttachDatas.forEach(function (elem) {
                        if(elem.New === true) {
                            oModel.refreshSecurityToken();
                            const oRequest = oModel._createRequest();
                            const oHeaders = {
                                "x-csrf-token": oRequest.headers["x-csrf-token"],
                                "slug": [Appno, Type, encodeURI(elem.Fname)].join("|")
                            };
            
                            // common.Common.log(oHeaders.slug);
                            
                            jQuery.ajax({
                                type: "POST",
                                async: false,
                                url: "/proxy/sap/opu/odata/sap/ZHR_COMMON_SRV/FileUploadSet/",
                                headers: oHeaders,
                                cache: false,
                                contentType: elem.type,
                                processData: false,
                                data: elem,
                                success: _handleSuccess.bind(this),
                                error: _handleError.bind(this)
                            });
                        }
                    }.bind(this));
                } catch (oException) {
                    jQuery.sap.log.error("File upload failed:\n" + oException.message);
                }
            }
        }
    }
);