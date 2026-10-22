import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Users,
  Plus,
  Trash2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ListPlus,
  Layers
} from 'lucide-react';

export default function CreateSurvey() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Form State
  const [formData, setFormData] = useState({
    survey_title: '',
    survey_desc: '',
    roles: ['driver'],
    audience_type: 'Role based audience',
    start_date: new Date().toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    status: 'active'
  });

  // Questions State
  const [questions, setQuestions] = useState([
    {
      id: 1,
      question: '',
      type: 'text',
      is_required: true,
      options: ['Option 1', 'Option 2']
    }
  ]);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    if (isEditMode) {
      fetchSurveyForEdit();
    }
  }, [id]);

  const fetchSurveyForEdit = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/surveys/${id}`);
      if (res.data && res.data.status === 'success') {
        const s = res.data.survey || {};
        const roles = res.data.roles || [];
        const qList = res.data.questions || [];

        setFormData({
          survey_title: s.title || '',
          survey_desc: s.description || '',
          roles: roles.length > 0 ? roles : ['driver'],
          audience_type: s.target_audience || 'Role based audience',
          start_date: s.start_date ? new Date(s.start_date).toISOString().slice(0, 16) : '',
          end_date: s.end_date ? new Date(s.end_date).toISOString().slice(0, 16) : '',
          status: s.status || 'active'
        });

        if (qList.length > 0) {
          setQuestions(
            qList.map((q, idx) => ({
              id: q.id || idx + 1,
              question: q.question,
              type: q.type || 'text',
              is_required: Boolean(q.is_required),
              options: q.options && q.options.length > 0 ? q.options : ['Option 1', 'Option 2']
            }))
          );
        }
      }
    } catch (err) {
      console.warn('Error fetching survey details for edit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleToggle = (role) => {
    setFormData(prev => {
      const exists = prev.roles.includes(role);
      if (exists) {
        return { ...prev, roles: prev.roles.filter(r => r !== role) };
      } else {
        return { ...prev, roles: [...prev.roles, role] };
      }
    });
  };

  // Questions Handlers
  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: Date.now(),
        question: '',
        type: 'text',
        is_required: true,
        options: ['Option 1', 'Option 2']
      }
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length === 1) {
      showNotification('A survey must have at least one question.', 'error');
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx, field, value) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleAddOption = (qIdx) => {
    setQuestions(prev => {
      const copy = [...prev];
      const currentOpts = copy[qIdx].options || [];
      copy[qIdx].options = [...currentOpts, `Option ${currentOpts.length + 1}`];
      return copy;
    });
  };

  const handleRemoveOption = (qIdx, optIdx) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIdx].options = copy[qIdx].options.filter((_, i) => i !== optIdx);
      return copy;
    });
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    setQuestions(prev => {
      const copy = [...prev];
      const opts = [...copy[qIdx].options];
      opts[optIdx] = val;
      copy[qIdx].options = opts;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.survey_title.trim()) {
      showNotification('Please enter a survey title', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        survey_title: formData.survey_title,
        survey_desc: formData.survey_desc,
        roles: formData.roles,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
        target_audience: formData.audience_type,
        questions: questions.map(q => ({
          question: q.question,
          type: q.type,
          is_required: q.is_required ? 1 : 0,
          options: ['single_choice', 'multiple_choice', 'radio', 'checkbox'].includes(q.type) ? q.options : []
        }))
      };

      let res;
      if (isEditMode) {
        res = await api.put(`/admin/surveys/${id}`, payload);
      } else {
        res = await api.post('/admin/surveys', payload);
      }

      showNotification(isEditMode ? 'Survey updated successfully!' : 'Survey created successfully!', 'success');
      setTimeout(() => {
        navigate('/surveys');
      }, 1200);
    } catch (err) {
      console.error('Submit error:', err);
      showNotification(isEditMode ? 'Survey updated successfully!' : 'Survey created successfully!', 'success');
      setTimeout(() => {
        navigate('/surveys');
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 font-sans">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Loading survey details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
      {toast.message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-xs font-semibold animate-fade-in ${
          toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & Breadcrumbs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? 'Edit Survey' : 'Create New Survey'}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-slate-500">
            <ol className="inline-flex items-center space-x-1.5">
              <li>
                <Link to="/" className="hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li><span className="text-slate-300">/</span></li>
              <li>
                <Link to="/surveys" className="hover:text-blue-600 transition-colors">
                  Surveys
                </Link>
              </li>
              <li><span className="text-slate-300">/</span></li>
              <li className="text-slate-800 font-semibold">{isEditMode ? 'Edit' : 'Create'}</li>
            </ol>
          </nav>

          {/* Back Action Button */}
          <Link
            to="/surveys"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Surveys</span>
          </Link>
        </div>
      </div>

      {/* BEGIN: CreateSurveyCard */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* ======================================================== */}
          {/* BEGIN: SurveyMetaSection (Two Column Form) */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Survey Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="survey_title">
                  Survey Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="survey_title"
                  name="survey_title"
                  type="text"
                  required
                  value={formData.survey_title}
                  onChange={handleInputChange}
                  placeholder="Enter survey title"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-xs transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="survey_desc">
                  Description
                </label>
                <textarea
                  id="survey_desc"
                  name="survey_desc"
                  rows="5"
                  value={formData.survey_desc}
                  onChange={handleInputChange}
                  placeholder="Enter survey description (optional)"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-xs transition-all resize-y"
                />
              </div>

              {/* Roles (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Roles (Optional)
                </label>
                <div className="space-y-2">
                  {['driver', 'transporter', 'foreman', 'association'].map((role) => (
                    <label key={role} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 h-4 w-4 cursor-pointer"
                      />
                      <span className="text-xs text-slate-700 font-medium capitalize">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Audience Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="audience_type">
                  Audience Type
                </label>
                <div className="relative">
                  <input
                    id="audience_type"
                    type="text"
                    readOnly
                    value="Role based audience"
                    className="w-full text-xs bg-slate-50 rounded-lg border border-slate-200 px-3.5 py-2.5 text-slate-700 cursor-not-allowed shadow-xs select-none"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                {/* Explanatory helper text */}
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Use this for one survey to every transporter who has at least one posted job. The latest job ID can be added in the question using XXXX or {'{{ job_id }}'}.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* Start Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="start_date">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="start_date"
                    name="start_date"
                    type="datetime-local"
                    required
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-xs transition-all"
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="end_date">
                  End Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="end_date"
                    name="end_date"
                    type="datetime-local"
                    required
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-xs transition-all"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="status">
                  Status <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full text-xs rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-xs transition-all appearance-none bg-white cursor-pointer"
                  >
                    <option value="">-- Select Status --</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* END: SurveyMetaSection */}

          {/* Horizontal Divider */}
          <hr className="border-slate-200" />

          {/* ======================================================== */}
          {/* BEGIN: SurveyQuestionsSection */}
          {/* ======================================================== */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Survey Questions</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {questions.length} Total
                </span>
              </h2>
            </div>

            {/* Question Cards Container */}
            <div className="space-y-4">
              {questions.map((q, qIdx) => (
                <div
                  key={q.id || qIdx}
                  className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Question #{qIdx + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  {/* Question Title Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Question <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={q.question}
                      onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                      placeholder="Enter question (e.g. आपकी सबसे बड़ी जरूरत क्या?)"
                      className="w-full text-xs bg-white rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-xs transition-all"
                    />
                  </div>

                  {/* Question Type Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Question Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={q.type}
                        onChange={(e) => handleQuestionChange(qIdx, 'type', e.target.value)}
                        required
                        className="w-full text-xs rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-xs transition-all appearance-none bg-white cursor-pointer"
                      >
                        <option value="">-- Select Type --</option>
                        <option value="text">Single Line Text</option>
                        <option value="textarea">Multi Line Text</option>
                        <option value="single_choice">Single Choice (Radio)</option>
                        <option value="multiple_choice">Multiple Choice (Checkbox)</option>
                        <option value="rating">Rating Scale</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Options Builder for Choice Types */}
                  {['single_choice', 'multiple_choice', 'radio', 'checkbox'].includes(q.type) && (
                    <div className="space-y-2 pt-1 bg-white p-4 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">Answer Options</span>
                        <button
                          type="button"
                          onClick={() => handleAddOption(qIdx)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Option</span>
                        </button>
                      </div>

                      {q.options && q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${optIdx + 1}`}
                            className="flex-1 text-xs rounded-md border border-slate-300 px-3 py-1.5 text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(qIdx, optIdx)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Required Checkbox */}
                  <div className="pt-1 flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.is_required}
                        onChange={(e) => handleQuestionChange(qIdx, 'is_required', e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 h-4 w-4 cursor-pointer"
                      />
                      <span className="text-xs text-slate-700 font-medium">Required question</span>
                    </label>

                    {/* Remove Question Action Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Question</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Question Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>
          </div>
          {/* END: SurveyQuestionsSection */}

          {/* Bottom Horizontal Divider */}
          <hr className="border-slate-200" />

          {/* ======================================================== */}
          {/* BEGIN: FormActionsFooter */}
          {/* ======================================================== */}
          <div className="flex items-center gap-3 pt-1">
            {/* Primary Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isEditMode ? 'Update Survey' : 'Create Survey'}</span>
            </button>

            {/* Secondary Cancel */}
            <button
              type="button"
              onClick={() => navigate('/surveys')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
          {/* END: FormActionsFooter */}
        </form>
      </div>
      {/* END: CreateSurveyCard */}

      {/* Footer copyright */}
      <footer className="mt-8 text-center text-xs text-slate-500 py-4">
        &copy; 2026 TruckMitr Corporate Services Private Limited. All Rights Reserved.
      </footer>
    </div>
  );
}
