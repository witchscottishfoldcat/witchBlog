import { useEffect, useState, useRef } from 'react';
import { Pencil, Save, X, Upload, ExternalLink, Calendar, Check, Loader2, Settings, Plus } from 'lucide-react';
import { Service } from '../services';
import type { SiteConfig } from '../services/models/SiteConfig';
import type { SiteConfigUpdate } from '../services/models/SiteConfigUpdate';
import { revalidateSiteConfig } from '../utils/cache';
import { useToast } from '../components/Toast';
import './SiteConfig.css';

// 后端 create 接口仅 site_name 必填，其余字段可选
interface SiteConfigForm {
  site_name: string;
  site_signature: string;
  site_announcement: string;
  is_active: boolean;
}

const EMPTY_FORM: SiteConfigForm = {
  site_name: '',
  site_signature: '',
  site_announcement: '',
  is_active: true,
};

export default function SiteConfig() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  // noConfig=后端无激活配置（404），可创建初始配置；loadFailed=其他加载错误
  const [noConfig, setNoConfig] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [createForm, setCreateForm] = useState<SiteConfigForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [formData, setFormData] = useState<SiteConfigUpdate>({
    site_name: '',
    site_signature: '',
    site_announcement: '',
    site_icon: '',
    profile_image: '',
    is_active: true,
  });
  const iconUploadRef = useRef<HTMLInputElement>(null);
  const profileUploadRef = useRef<HTMLInputElement>(null);

  const toast = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setNoConfig(false);
    setLoadFailed(false);
    try {
      const response = await Service.readActiveSiteConfigApiV1SiteConfigActiveGet();
      setConfig(response);
      // 初始化表单数据
      setFormData({
        site_name: response.site_name || '',
        site_signature: response.site_signature || '',
        site_announcement: response.site_announcement || '',
        site_icon: response.site_icon || '',
        profile_image: response.profile_image || '',
        is_active: response.is_active ?? true,
      });
    } catch (error: any) {
      console.error('加载配置失败:', error);
      if (error?.response?.status === 404 || error?.status === 404) {
        setNoConfig(true);
      } else {
        setLoadFailed(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInputChange = (field: keyof SiteConfigForm, value: string | boolean) => {
    setCreateForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!createForm.site_name.trim()) {
      toast.error('请填写网站名称');
      return;
    }

    setCreating(true);
    try {
      await Service.createSiteConfigApiV1SiteConfigPost({
        site_name: createForm.site_name.trim(),
        site_signature: createForm.site_signature || null,
        site_announcement: createForm.site_announcement || null,
        is_active: createForm.is_active,
      });
      toast.success('初始配置创建成功');
      setCreateForm(EMPTY_FORM);
      // 新配置生效后同样通知前台清缓存（与保存路径一致）
      revalidateSiteConfig().catch(err => {
        console.error('清除缓存失败（不影响主要功能）:', err);
      });
      await loadConfig();
    } catch (error: any) {
      console.error('创建配置失败:', error);
      const detail = error?.response?.data?.detail || error?.body?.detail;
      toast.error(typeof detail === 'string' ? detail : '创建配置失败');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    if (config) {
      setFormData({
        site_name: config.site_name || '',
        site_signature: config.site_signature || '',
        site_announcement: config.site_announcement || '',
        site_icon: config.site_icon || '',
        profile_image: config.profile_image || '',
        is_active: config.is_active ?? true,
      });
    }
    setEditing(false);
  };

  const handleSave = async () => {
    if (!config?.id) {
      alert('配置ID不存在');
      return;
    }

    setSaving(true);
    // 乐观更新：先更新 UI，让用户立即看到变化
    const optimisticConfig: SiteConfig = {
      ...config,
      ...formData,
      updated_at: new Date().toISOString(),
    };
    setConfig(optimisticConfig);
    setEditing(false);

    try {
      const updatedConfig = await Service.updateSiteConfigApiV1SiteConfigConfigIdPut(
        config.id,
        formData
      );
      // 用服务器返回的真实数据更新（包含正确的 updated_at）
      setConfig(updatedConfig);

      // 清除缓存（后台进行，不阻塞 UI）
      revalidateSiteConfig().catch(err => {
        console.error('清除缓存失败（不影响主要功能）:', err);
      });

      // 使用 requestAnimationFrame 确保 UI 更新后再显示提示
      requestAnimationFrame(() => {
        setTimeout(() => {
          alert('配置更新成功！');
        }, 100);
      });
    } catch (error) {
      console.error('更新配置失败:', error);
      // 如果失败，恢复原始数据和编辑状态
      setConfig(config);
      setEditing(true);
      requestAnimationFrame(() => {
        setTimeout(() => {
          alert('更新配置失败，请查看控制台');
        }, 100);
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SiteConfigUpdate, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleIconUpload = async () => {
    if (!iconUploadRef.current?.files?.[0]) {
      alert('请选择要上传的图标');
      return;
    }

    if (!config?.id) {
      alert('配置ID不存在');
      return;
    }

    setUploadingIcon(true);
    try {
      const file = iconUploadRef.current.files[0];
      const formData = {
        file: file,
      };

      const response = await Service.uploadSiteIconApiV1SiteConfigConfigIdUploadIconPost(
        config.id,
        formData
      );
      if (iconUploadRef.current) {
        iconUploadRef.current.value = '';
      }

      // 尝试从响应中获取 URL，如果没有则重新加载配置
      let iconUrl: string | null = null;
      if (response && typeof response === 'object') {
        // 检查响应中是否有 URL 字段
        iconUrl = (response as any).url || (response as any).site_icon || (response as any).icon_url || null;
      }

      if (iconUrl) {
        // 如果响应中有 URL，立即更新（乐观更新）
        const optimisticConfig: SiteConfig = {
          ...config,
          site_icon: iconUrl,
          updated_at: new Date().toISOString(),
        };
        setConfig(optimisticConfig);
        if (editing) {
          setFormData(prev => ({
            ...prev,
            site_icon: iconUrl || prev.site_icon,
          }));
        }
      }

      // 清除缓存
      revalidateSiteConfig().catch(err => {
        console.error('清除缓存失败（不影响主要功能）:', err);
      });

      // 重新加载配置以确保数据同步（后台进行，不阻塞 UI）
      Service.readActiveSiteConfigApiV1SiteConfigActiveGet().then(updatedConfig => {
        setConfig(updatedConfig);
        if (editing) {
          setFormData(prev => ({
            ...prev,
            site_icon: updatedConfig.site_icon || prev.site_icon,
          }));
        }
      }).catch(err => {
        console.error('重新加载配置失败:', err);
      });

      // 延迟显示提示，让 UI 先更新
      requestAnimationFrame(() => {
        setTimeout(() => {
          alert('图标上传成功！');
        }, 100);
      });
    } catch (error) {
      console.error('上传图标失败:', error);
      alert('上传图标失败，请查看控制台');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleProfileUpload = async () => {
    if (!profileUploadRef.current?.files?.[0]) {
      alert('请选择要上传的个人资料图片');
      return;
    }

    if (!config?.id) {
      alert('配置ID不存在');
      return;
    }

    setUploadingProfile(true);
    try {
      const file = profileUploadRef.current.files[0];
      const formData = {
        file: file,
      };

      const response = await Service.uploadProfileImageApiV1SiteConfigConfigIdUploadProfilePost(
        config.id,
        formData
      );
      if (profileUploadRef.current) {
        profileUploadRef.current.value = '';
      }

      // 尝试从响应中获取 URL，如果没有则重新加载配置
      let profileUrl: string | null = null;
      if (response && typeof response === 'object') {
        // 检查响应中是否有 URL 字段
        profileUrl = (response as any).url || (response as any).profile_image || (response as any).profile_url || null;
      }

      if (profileUrl) {
        // 如果响应中有 URL，立即更新（乐观更新）
        const optimisticConfig: SiteConfig = {
          ...config,
          profile_image: profileUrl,
          updated_at: new Date().toISOString(),
        };
        setConfig(optimisticConfig);
        if (editing) {
          setFormData(prev => ({
            ...prev,
            profile_image: profileUrl || prev.profile_image,
          }));
        }
      }

      // 清除缓存
      revalidateSiteConfig().catch(err => {
        console.error('清除缓存失败（不影响主要功能）:', err);
      });

      // 重新加载配置以确保数据同步（后台进行，不阻塞 UI）
      Service.readActiveSiteConfigApiV1SiteConfigActiveGet().then(updatedConfig => {
        setConfig(updatedConfig);
        if (editing) {
          setFormData(prev => ({
            ...prev,
            profile_image: updatedConfig.profile_image || prev.profile_image,
          }));
        }
      }).catch(err => {
        console.error('重新加载配置失败:', err);
      });

      // 延迟显示提示，让 UI 先更新
      requestAnimationFrame(() => {
        setTimeout(() => {
          alert('个人资料图片上传成功！');
        }, 100);
      });
    } catch (error) {
      console.error('上传个人资料图片失败:', error);
      alert('上传个人资料图片失败，请查看控制台');
    } finally {
      setUploadingProfile(false);
    }
  };

  return (
    <div className="wc-page site-config-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">网站配置</h1>
            <p className="wc-page-subtitle">管理网站名称、图标与公告</p>
          </div>
        </div>
        {!editing ? (
          <div className="wc-page-actions">
            <button type="button" onClick={handleEdit} className="wc-btn wc-btn-primary">
              <Pencil size={16} /> 编辑配置
            </button>
          </div>
        ) : (
          <div className="wc-page-actions">
            <button type="button" onClick={handleCancel} className="wc-btn wc-btn-secondary" disabled={saving}>取消</button>
            <button type="button" onClick={handleSave} className="wc-btn wc-btn-primary" disabled={saving}>
              {saving ? '保存中...' : <><Save size={16} /> 保存</>}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="wc-loading site-config-loading"><Loader2 size={18} className="wc-spinner" /> 加载中...</div>
      ) : noConfig ? (
        <section className="wc-card">
          <div className="wc-card-header">
            <div>
              <h2 className="wc-card-title">创建初始配置</h2>
              <p className="wc-card-subtitle">当前还没有激活的站点配置，填写基本信息创建一条</p>
            </div>
          </div>
          <form
            className="wc-form wc-card-body"
            onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
          >
            <div className="wc-field">
              <label className="wc-label">网站名称 *</label>
              <input
                type="text"
                value={createForm.site_name}
                onChange={(e) => handleCreateInputChange('site_name', e.target.value)}
                className="wc-input"
                placeholder="请输入网站名称"
                disabled={creating}
              />
            </div>
            <div className="wc-field">
              <label className="wc-label">网站签名</label>
              <input
                type="text"
                value={createForm.site_signature}
                onChange={(e) => handleCreateInputChange('site_signature', e.target.value)}
                className="wc-input"
                placeholder="请输入网站签名"
                disabled={creating}
              />
            </div>
            <div className="wc-field">
              <label className="wc-label">网站公告</label>
              <textarea
                value={createForm.site_announcement}
                onChange={(e) => handleCreateInputChange('site_announcement', e.target.value)}
                className="wc-textarea"
                placeholder="请输入网站公告"
                rows={4}
                disabled={creating}
              />
            </div>
            <div className="wc-field">
              <label className="wc-label">启用状态</label>
              <label className="wc-check">
                <input
                  type="checkbox"
                  checked={createForm.is_active}
                  onChange={(e) => handleCreateInputChange('is_active', e.target.checked)}
                  disabled={creating}
                />
                <span>{createForm.is_active ? '已启用' : '已禁用'}</span>
              </label>
            </div>
            <div className="wc-field">
              <button type="submit" className="wc-btn wc-btn-primary" disabled={creating || !createForm.site_name.trim()}>
                {creating ? '创建中...' : <><Plus size={16} /> 创建配置</>}
              </button>
            </div>
          </form>
        </section>
      ) : loadFailed ? (
        <div className="wc-empty">
          <span className="wc-empty-icon"><Settings size={28} /></span>
          <p>配置加载失败</p>
          <button type="button" className="wc-btn wc-btn-secondary" onClick={loadConfig}>重试</button>
        </div>
      ) : !config ? (
        <div className="wc-empty">
          <span className="wc-empty-icon"><Settings size={28} /></span>
          <p>暂无网站配置</p>
        </div>
      ) : (
        <>
        <section className="wc-card">
        <div className="wc-card-header">
          <div>
            <h2 className="wc-card-title">基本信息</h2>
            <p className="wc-card-subtitle">网站名称、签名与公告</p>
          </div>
        </div>
        <form className="wc-form wc-card-body">
          <div className="wc-field">
            <label className="wc-label">网站名称</label>
            {editing ? (
              <input type="text" value={formData.site_name || ''} onChange={(e) => handleInputChange('site_name', e.target.value)} className="wc-input" placeholder="请输入网站名称" />
            ) : (
              <p className="sc-value">{config.site_name || '未设置'}</p>
            )}
          </div>

          <div className="wc-field">
            <label className="wc-label">网站签名</label>
            {editing ? (
              <input type="text" value={formData.site_signature || ''} onChange={(e) => handleInputChange('site_signature', e.target.value)} className="wc-input" placeholder="请输入网站签名" />
            ) : (
              <p className="sc-value">{config.site_signature || '未设置'}</p>
            )}
          </div>

          <div className="wc-field">
            <label className="wc-label">网站公告</label>
            {editing ? (
              <textarea value={formData.site_announcement || ''} onChange={(e) => handleInputChange('site_announcement', e.target.value)} className="wc-textarea" placeholder="请输入网站公告" rows={4} />
            ) : (
              <p className="sc-value sc-pre">{config.site_announcement || '未设置'}</p>
            )}
          </div>

          <div className="wc-field">
            <label className="wc-label">启用状态</label>
            {editing ? (
              <label className="wc-check">
                <input
                  type="checkbox"
                  checked={formData.is_active ?? true}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                />
                <span>{formData.is_active ? '已启用' : '已禁用'}</span>
              </label>
            ) : (
              <p className="sc-value">
                {config.is_active ? <><Check size={16} /> 已启用</> : <><X size={16} /> 已禁用</>}
              </p>
            )}
          </div>
        </form>
      </section>

      <section className="wc-card">
        <div className="wc-card-header">
          <div>
            <h2 className="wc-card-title">图片设置</h2>
            <p className="wc-card-subtitle">网站图标与个人资料图片</p>
          </div>
        </div>
        <div className="wc-form wc-card-body">
          <div className="wc-field">
            <label className="wc-label">网站图标</label>
            <div className="sc-image-section">
              {(config.site_icon || formData.site_icon) && (
                <img src={formData.site_icon || config.site_icon || ''} alt="网站图标" className="sc-image-preview" />
              )}
              <div className="sc-image-controls">
                {editing ? (
                  <>
                    <div className="wc-input-group">
                      <input type="text" value={formData.site_icon || ''} onChange={(e) => handleInputChange('site_icon', e.target.value)} className="wc-input" placeholder="图标URL或上传文件" />
                      <button type="button" onClick={() => iconUploadRef.current?.click()} disabled={uploadingIcon} className="wc-btn wc-btn-secondary">
                        {uploadingIcon ? '上传中...' : <><Upload size={16} /> 上传图标</>}
                      </button>
                    </div>
                    <input ref={iconUploadRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleIconUpload} />
                  </>
                ) : (
                  <>
                    <input ref={iconUploadRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleIconUpload} />
                    <button type="button" onClick={() => iconUploadRef.current?.click()} disabled={uploadingIcon} className="wc-btn wc-btn-secondary">
                      {uploadingIcon ? '上传中...' : <><Upload size={16} /> 上传图标</>}
                    </button>
                    {config.site_icon && (
                      <a href={config.site_icon} target="_blank" rel="noopener noreferrer" className="wc-btn wc-btn-ghost"><ExternalLink size={14} /> 查看图标</a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="wc-field">
            <label className="wc-label">个人资料图片</label>
            <div className="sc-image-section">
              {(config.profile_image || formData.profile_image) && (
                <img src={formData.profile_image || config.profile_image || ''} alt="个人资料" className="sc-image-preview sc-image-large" />
              )}
              <div className="sc-image-controls">
                {editing ? (
                  <>
                    <div className="wc-input-group">
                      <input type="text" value={formData.profile_image || ''} onChange={(e) => handleInputChange('profile_image', e.target.value)} className="wc-input" placeholder="头像URL或上传文件" />
                      <button type="button" onClick={() => profileUploadRef.current?.click()} disabled={uploadingProfile} className="wc-btn wc-btn-secondary">
                        {uploadingProfile ? '上传中...' : <><Upload size={16} /> 上传头像</>}
                      </button>
                    </div>
                    <input ref={profileUploadRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfileUpload} />
                  </>
                ) : (
                  <>
                    <input ref={profileUploadRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfileUpload} />
                    <button type="button" onClick={() => profileUploadRef.current?.click()} disabled={uploadingProfile} className="wc-btn wc-btn-secondary">
                      {uploadingProfile ? '上传中...' : <><Upload size={16} /> 上传头像</>}
                    </button>
                    {config.profile_image && (
                      <a href={config.profile_image} target="_blank" rel="noopener noreferrer" className="wc-btn wc-btn-ghost"><ExternalLink size={14} /> 查看图片</a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wc-card">
        <div className="wc-card-header">
          <div>
            <h2 className="wc-card-title">其他信息</h2>
            <p className="wc-card-subtitle">系统记录的时间信息</p>
          </div>
        </div>
        <div className="wc-card-body">
          <div className="sc-meta-row">
            <span className="sc-meta-label"><Calendar size={14} /> 创建时间</span>
            <span className="sc-meta-value">{new Date(config.created_at).toLocaleString()}</span>
          </div>
          <div className="sc-meta-row">
            <span className="sc-meta-label"><Calendar size={14} /> 更新时间</span>
            <span className="sc-meta-value">{new Date(config.updated_at).toLocaleString()}</span>
          </div>
        </div>
      </section>
        </>
      )}
    </div>
  );
}
