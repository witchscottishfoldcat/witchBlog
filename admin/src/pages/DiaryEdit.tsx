import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Service } from '../services';
import type { DiaryCreate, DiaryUpdate, DiaryResponse } from '../services';
import { sanitizeEditorHtml } from '../utils/sanitize';
import './DiaryEdit.css';

export default function DiaryEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    weather: '',
    mood: '',
    tags: [] as string[],
    tagInput: '',
    is_public: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  // HTML 属性上下文转义：防止 URL/alt 中的引号逃出属性注入事件属性
  const escapeAttr = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 将 Markdown 转换为 HTML
  // 输出会再经 sanitizeEditorHtml 白名单净化后才写入编辑器（内容来自后端，不可信任）
  const convertMarkdownToHtml = (markdown: string): string => {
    if (!markdown) return '';
    return sanitizeEditorHtml(
      markdown
        .split('\n')
        .map((line: string) => {
          const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
          if (imageMatch) {
            return `<img src="${escapeAttr(imageMatch[2])}" alt="${escapeAttr(imageMatch[1])}" style="max-width: 100%; height: auto; display: block; margin: 1rem 0; border-radius: 8px; cursor: move;" draggable="true" contenteditable="false" />`;
          }
          return line ? `<div>${line}</div>` : '<br>';
        })
        .join('')
    );
  };

  useEffect(() => {
    if (isEdit && id) {
      loadDiary();
    } else if (contentEditableRef.current) {
      // 新建日记时，清空编辑器
      contentEditableRef.current.innerHTML = '';
    }
  }, [id, isEdit]);



  // 初始化编辑器图片拖拽功能
  useEffect(() => {
    if (!contentEditableRef.current) return;

    const editor = contentEditableRef.current;
    
    // 为所有图片添加拖拽功能
    const setupImageDrag = () => {
      const images = editor.querySelectorAll('img');
      images.forEach((img) => {
        img.draggable = true;
        img.setAttribute('contenteditable', 'false');
        img.style.cursor = 'move';
        
        img.addEventListener('dragstart', (e) => {
          if (e.dataTransfer) {
            e.dataTransfer.setData('text/html', img.outerHTML);
            e.dataTransfer.effectAllowed = 'move';
          }
          img.style.opacity = '0.5';
        });
        
        img.addEventListener('dragend', () => {
          img.style.opacity = '1';
          updateContentFromEditor();
        });
      });
    };

    setupImageDrag();

    // 监听内容变化，为新插入的图片设置拖拽功能
    const observer = new MutationObserver(() => {
      setupImageDrag();
    });

    observer.observe(editor, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [formData.content]);

  const loadDiary = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const diary: DiaryResponse = await Service.getDiaryApiV1DiariesDiaryIdGet(Number(id));
      const content = diary.content || '';
      
      setFormData({
        title: diary.title || '',
        content: content,
        weather: diary.weather || '',
        mood: diary.mood || '',
        tags: diary.tags || [],
        tagInput: '',
        is_public: diary.is_public || false,
      });
      
      // 更新编辑器内容
      if (contentEditableRef.current) {
        const htmlContent = convertMarkdownToHtml(content);
        contentEditableRef.current.innerHTML = htmlContent;
      }
    } catch (error) {
      console.error('加载日记失败:', error);
      setError('加载日记失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (formData.tagInput.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: '',
      });
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const uploadImageFile = async (file: File): Promise<string | null> => {
    if (!isEdit || !id) {
      // 如果是新建日记，先保存
      alert('请先保存日记，然后再上传图片');
      return null;
    }

    setUploadingImage(true);
    try {
      // 1. 获取预签名上传URL
      const uploadUrls = await Service.getImageUploadUrlsApiV1DiariesDiaryIdImagesUploadUrlsPost(
        Number(id),
        1
      );
      
      if (!uploadUrls || uploadUrls.length === 0) {
        throw new Error('获取上传URL失败');
      }
      
      const uploadUrlData = uploadUrls[0];
      
      // 2. 上传图片到MinIO
      const uploadResponse = await fetch(uploadUrlData.upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error('上传图片到MinIO失败');
      }
      
      // 3. 保存图片信息
      // 根据 API 文档，需要传递以下字段：
      // - minio_object_name: MinIO 对象名称（必需）
      // - original_filename: 原始文件名（必需）
      // - file_size: 文件大小（必需）
      // - mime_type: MIME 类型（必需）
      const imageInfo: Record<string, any> = {
        minio_object_name: uploadUrlData.object_name,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
      };

      console.log('保存图片信息:', imageInfo);
      
      const savedImage = await Service.saveImageInfoApiV1DiariesDiaryIdImagesPost(Number(id), imageInfo);
      
      // 返回图片URL
      return savedImage.image_url || null;
    } catch (error: any) {
      console.error('上传图片失败:', error);
      console.error('完整错误对象:', error);
      console.error('错误响应:', error?.response);
      console.error('错误 body:', error?.body);
      console.error('错误 data:', error?.response?.data);
      
      const errorDetail = error?.body?.detail || error?.response?.data?.detail || error?.response?.data;
      let errorMsg = '上传图片失败';
      
      if (errorDetail) {
        if (typeof errorDetail === 'string') {
          errorMsg = errorDetail;
        } else if (Array.isArray(errorDetail)) {
          errorMsg = errorDetail.map((d: any) => {
            if (typeof d === 'string') return d;
            return d.msg || d.loc?.join('.') + ': ' + d.msg || JSON.stringify(d);
          }).join(', ');
        } else if (typeof errorDetail === 'object') {
          errorMsg = JSON.stringify(errorDetail, null, 2);
        } else {
          errorMsg = String(errorDetail);
        }
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      console.error('解析后的错误信息:', errorMsg);
      alert(`上传图片失败: ${errorMsg}\n\n请查看控制台获取详细信息`);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const insertImageAtCursor = (imageUrl: string) => {
    if (!contentEditableRef.current) return;

    const selection = window.getSelection();
    let range: Range;
    
    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(contentEditableRef.current);
      range.collapse(false);
    }
    
    // 创建图片元素
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'image';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '1rem 0';
    img.style.borderRadius = '8px';
    img.style.cursor = 'move';
    img.draggable = true;
    img.setAttribute('contenteditable', 'false');
    
    // 设置图片拖拽事件
    img.addEventListener('dragstart', (e) => {
      if (e.dataTransfer) {
        e.dataTransfer.setData('text/html', img.outerHTML);
        e.dataTransfer.effectAllowed = 'move';
      }
      img.style.opacity = '0.5';
    });
    
    img.addEventListener('dragend', () => {
      img.style.opacity = '1';
      updateContentFromEditor();
    });
    
    // 插入图片
    range.deleteContents();
    range.insertNode(img);
    
    // 在图片后插入换行
    const br = document.createElement('br');
    range.setStartAfter(img);
    range.insertNode(br);
    
    // 移动光标到图片后
    range.setStartAfter(br);
    range.collapse(true);
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // 更新内容
    updateContentFromEditor();
  };

  const handleImageUpload = async () => {
    if (!imageUploadRef.current?.files?.[0]) {
      alert('请选择要上传的图片');
      return;
    }

    const file = imageUploadRef.current.files[0];
    const imageUrl = await uploadImageFile(file);
    
    if (imageUrl) {
      insertImageAtCursor(imageUrl);
      if (imageUploadRef.current) {
        imageUploadRef.current.value = '';
      }
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      // 处理图片元素拖拽移动
      const html = e.dataTransfer.getData('text/html');
      if (html && contentEditableRef.current) {
        const selection = window.getSelection();
        const x = e.clientX;
        const y = e.clientY;
        
        // 获取拖拽位置
        if (document.caretRangeFromPoint) {
          const range = document.caretRangeFromPoint(x, y);
          if (range && contentEditableRef.current.contains(range.commonAncestorContainer)) {
            const tempDiv = document.createElement('div');
            // 拖拽来源不可信任（可来自任意网页），先净化再解析
            tempDiv.innerHTML = sanitizeEditorHtml(html);
            const img = tempDiv.querySelector('img');
            if (img) {
              range.deleteContents();
              range.insertNode(img);
              const br = document.createElement('br');
              range.setStartAfter(img);
              range.insertNode(br);
              range.setStartAfter(br);
              range.collapse(true);
              if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
              }
              updateContentFromEditor();
            }
          }
        }
      }
      return;
    }

    // 设置插入位置
    const selection = window.getSelection();
    if (contentEditableRef.current) {
      const x = e.clientX;
      const y = e.clientY;
      
      if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(x, y);
        if (range && contentEditableRef.current.contains(range.commonAncestorContainer)) {
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    }

    // 上传并插入图片
    for (const file of imageFiles) {
      const imageUrl = await uploadImageFile(file);
      if (imageUrl) {
        insertImageAtCursor(imageUrl);
      }
    }
  }, [isEdit, id]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const updateContentFromEditor = () => {
    if (contentEditableRef.current) {
      const htmlContent = contentEditableRef.current.innerHTML;
      
      // 将 HTML 转换为 Markdown 格式
      let markdownContent = '';
      const tempDiv = document.createElement('div');
      // 纵深防御：解析前净化，避免离屏解析时恶意 img 事件属性被触发
      tempDiv.innerHTML = sanitizeEditorHtml(htmlContent);
      
      // 遍历所有节点
      const processNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const tagName = element.tagName.toLowerCase();
          
          if (tagName === 'img') {
            const img = element as HTMLImageElement;
            return `\n![${img.alt || 'image'}](${img.src})\n`;
          } else if (tagName === 'br') {
            return '\n';
          } else if (tagName === 'div' || tagName === 'p') {
            let content = '';
            for (let i = 0; i < element.childNodes.length; i++) {
              content += processNode(element.childNodes[i]);
            }
            return content + '\n';
          } else {
            let content = '';
            for (let i = 0; i < element.childNodes.length; i++) {
              content += processNode(element.childNodes[i]);
            }
            return content;
          }
        }
        return '';
      };
      
      for (let i = 0; i < tempDiv.childNodes.length; i++) {
        markdownContent += processNode(tempDiv.childNodes[i]);
      }
      
      // 清理多余的空行
      markdownContent = markdownContent.replace(/\n{3,}/g, '\n\n').trim();
      
      setFormData(prev => ({ ...prev, content: markdownContent }));
    }
  };

  const handleContentChange = () => {
    updateContentFromEditor();
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const imageUrl = await uploadImageFile(file);
          if (imageUrl) {
            insertImageAtCursor(imageUrl);
          }
        }
      } else if (item.type === 'text/html') {
        item.getAsString((html) => {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const tempDiv = document.createElement('div');
            // 粘贴的 HTML 可来自任意网页，净化后再插入编辑器
            tempDiv.innerHTML = sanitizeEditorHtml(html);
            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
              fragment.appendChild(tempDiv.firstChild);
            }
            range.insertNode(fragment);
            updateContentFromEditor();
          }
        });
      } else if (item.type === 'text/plain') {
        item.getAsString((text) => {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(text);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            updateContentFromEditor();
          }
        });
      }
    }
  }, [isEdit, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit && id) {
        const updateData: DiaryUpdate = {
          title: formData.title || null,
          content: formData.content || null,
          weather: formData.weather || null,
          mood: formData.mood || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          is_public: formData.is_public,
        };
        await Service.updateDiaryApiV1DiariesDiaryIdPut(Number(id), updateData);
      } else {
        const createData: DiaryCreate = {
          title: formData.title,
          content: formData.content,
          weather: formData.weather || null,
          mood: formData.mood || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          is_public: formData.is_public,
        };
        await Service.createDiaryApiV1DiariesPost(createData);
      }
      navigate('/diaries');
    } catch (error: any) {
      console.error('保存失败:', error);
      setError(error?.body?.detail || error?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wc-page diary-edit-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <button
            type="button"
            className="wc-btn wc-btn-ghost"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={18} /> 返回
          </button>
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">{isEdit ? '编辑日记' : '新建日记'}</h1>
          </div>
        </div>
        <div className="wc-page-actions">
          <button
            type="button"
            className="wc-btn wc-btn-secondary"
            onClick={() => navigate('/diaries')}
          >
            取消
          </button>
        </div>
      </div>

      {loading ? (
        <div className="wc-loading" style={{ minHeight: '12rem' }}><Loader2 size={18} className="wc-spinner" /> 加载中...</div>
      ) : (
        <div className="wc-card wc-card-pad">
          <form onSubmit={handleSubmit} className="wc-form">
            {error && <div className="wc-alert wc-alert-error">{error}</div>}

            <div className="wc-field">
              <label className="wc-label" htmlFor="title">标题 *</label>
              <input
                id="title"
                className="wc-input"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="请输入日记标题"
              />
            </div>

            <div className="wc-field">
              <label className="wc-label">内容 *</label>
              <div
                ref={contentEditableRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleContentChange}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onPaste={handlePaste}
                className={`diary-content-editor ${isDragging ? 'diary-content-editor-dragging' : ''}`}
              />
              <p className="wc-help">提示：可以直接拖拽图片到编辑区域，或粘贴剪贴板中的图片</p>
            </div>

            {isEdit && id && (
              <div className="wc-field">
                <label className="wc-label">上传图片</label>
                <div className="diary-edit-image-row">
                  <input
                    ref={imageUploadRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  <button
                    type="button"
                    onClick={() => imageUploadRef.current?.click()}
                    disabled={uploadingImage}
                    className="wc-btn wc-btn-secondary"
                  >
                    {uploadingImage ? '上传中...' : '选择图片上传'}
                  </button>
                  <span className="wc-help">
                    或直接拖拽图片到编辑区域，图片会自动插入到光标位置
                  </span>
                </div>
              </div>
            )}

            <div className="wc-form-grid">
              <div className="wc-field">
                <label className="wc-label" htmlFor="weather">天气</label>
                <input
                  id="weather"
                  className="wc-input"
                  type="text"
                  value={formData.weather}
                  onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                  placeholder="例如: 晴天"
                />
              </div>

              <div className="wc-field">
                <label className="wc-label" htmlFor="mood">心情</label>
                <input
                  id="mood"
                  className="wc-input"
                  type="text"
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                  placeholder="例如: 开心"
                />
              </div>
            </div>

            <div className="wc-field">
              <label className="wc-label">标签</label>
              <div className="wc-input-group">
                <input
                  className="wc-input"
                  type="text"
                  value={formData.tagInput}
                  onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="输入标签后按回车添加"
                />
                <button type="button" onClick={handleAddTag} className="wc-btn wc-btn-secondary">
                  添加
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="wc-tag-row diary-edit-tags">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="wc-tag">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(index)}
                        className="diary-edit-tag-remove"
                        title="移除"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <label className="wc-check">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              />
              公开
            </label>

            <div className="wc-form-actions">
              <button type="submit" className="wc-btn wc-btn-primary" disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                className="wc-btn wc-btn-ghost"
                onClick={() => navigate('/diaries')}
                disabled={saving}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
