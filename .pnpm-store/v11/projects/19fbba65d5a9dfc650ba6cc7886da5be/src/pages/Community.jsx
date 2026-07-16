import { useCallback, useEffect, useRef, useState } from "react";
import {
  addComment, bookmarkPost, createPost, createPostWithImage, deletePost,
  editPost, fetchBookmarkedPosts, fetchPosts, fetchTrendingPosts,
  fetchUserFeed, followUser, likePost, reportPost, sharePost,
} from "../api";
import "./Community.css";

const PAGE_SIZE = 10;
const idOf = (value) => (typeof value === "object" ? value?._id : value);
const formatDate = (value) => new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

function Community() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [mode, setMode] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const observerTarget = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  const flash = (message) => { setNotice(message); window.setTimeout(() => setNotice(""), 3000); };
  const getPage = useCallback(async (pageNumber, replace = false, selectedMode = mode, query = search) => {
    setLoading(true);
    try {
      let response;
      if (selectedMode === "following") response = await fetchUserFeed(currentUser._id, pageNumber, PAGE_SIZE);
      else if (selectedMode === "bookmarks") response = await fetchBookmarkedPosts(currentUser._id);
      else response = await fetchPosts(pageNumber, PAGE_SIZE, "-createdAt", query.startsWith("#") ? query : "", query.startsWith("#") ? "" : query);
      const data = response.data;
      const list = Array.isArray(data) ? data : data.posts || [];
      setPosts((old) => replace ? list : [...old, ...list]);
      setHasMore(Array.isArray(data) ? false : Boolean(data.hasMore ?? pageNumber < (data.pagination?.pages || 1)));
    } catch { flash("Could not load the feed. Please try again."); }
    finally { setLoading(false); }
  }, [currentUser, mode, search]);

  useEffect(() => { fetchTrendingPosts().then((res) => setTrending(res.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (!currentUser && mode !== "all") { setMode("all"); return; }
    setPage(1); getPage(1, true);
  }, [mode, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const searchFeed = (event) => { event.preventDefault(); setPage(1); getPage(1, true); };
  const loadMore = () => { if (loading || !hasMore) return; const next = page + 1; setPage(next); getPage(next); };
  loadMoreRef.current = loadMore;
  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !hasMore) return undefined;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadMoreRef.current(); }, { rootMargin: "250px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, page, loading]);
  const updatePost = (post) => setPosts((items) => items.map((item) => item._id === post._id ? post : item));

  const submitPost = async (event) => {
    event.preventDefault();
    if (!currentUser) return flash("Please sign in to post.");
    if (!content.trim()) return flash("Add some text to your post.");
    try {
      const payload = { author: currentUser.name, authorId: currentUser._id, content: content.trim(), codeSnippet: code.trim() ? { language, code: code.trim() } : null };
      const response = image
        ? await createPostWithImage(Object.entries(payload).reduce((form, [key, value]) => { form.append(key, typeof value === "object" ? JSON.stringify(value) : value ?? ""); return form; }, (() => { const form = new FormData(); form.append("image", image); return form; })()))
        : await createPost(payload);
      setPosts((items) => [response.data, ...items]); setContent(""); setCode(""); setImage(null); flash("Your post is live.");
    } catch { flash("Could not publish the post."); }
  };

  const react = async (post, action) => {
    if (!currentUser) return flash("Please sign in first.");
    try {
      if (action === "like") { const { data } = await likePost(post._id, currentUser._id); updatePost({ ...post, likes: data.likes, likedBy: data.isLiked ? [...(post.likedBy || []), currentUser._id] : (post.likedBy || []).filter((id) => idOf(id) !== currentUser._id) }); }
      if (action === "bookmark") { const { data } = await bookmarkPost(post._id, currentUser._id); updatePost({ ...post, bookmarks: data.isBookmarked ? [...(post.bookmarks || []), currentUser._id] : (post.bookmarks || []).filter((id) => idOf(id) !== currentUser._id) }); }
      if (action === "share") {
        const url = `${window.location.origin}/community?post=${post._id}`;
        if (navigator.share) {
          await navigator.share({ title: `${post.author}'s community post`, text: post.content.slice(0, 160), url });
        } else {
          await navigator.clipboard.writeText(url);
          flash("Share link copied. Paste it anywhere to share.");
        }
        const { data } = await sharePost(post._id);
        updatePost({ ...post, shares: data.shares });
        if (navigator.share) flash("Post shared.");
      }
    } catch { flash("That action could not be completed."); }
  };

  const comment = async (post, text, parentCommentId) => {
    if (!text.trim() || !currentUser) return;
    try { const { data } = await addComment(post._id, { user: currentUser.name, userId: currentUser._id, text, parentCommentId }); updatePost(data); }
    catch { flash("Could not add the comment."); }
  };
  const doReport = async (post) => { const reason = window.prompt("Why are you reporting this post?"); if (!reason || !currentUser) return; try { await reportPost(post._id, currentUser._id, reason); flash("Report sent for review."); } catch (error) { flash(error.response?.data?.message || "Could not submit report."); } };
  const toggleFollow = async (post) => { try { await followUser(currentUser._id, idOf(post.authorId)); flash(`Follow preference updated for ${post.author}.`); } catch { flash("Could not update follow preference."); } };

  return <div className="community-container">
    <div className="community-header"><h1>Community Feed</h1><p>Projects, code, learning wins, and helpful technical conversations.</p></div>
    {notice && <div className="alert alert-success">{notice}</div>}
    <div className="feed-toolbar">
      {[['all', 'Latest'], ['following', 'Following'], ['bookmarks', 'Saved']].map(([value, label]) => <button key={value} className={mode === value ? 'active-filter' : ''} onClick={() => setMode(value)} disabled={!currentUser && value !== 'all'}>{label}</button>)}
      <form onSubmit={searchFeed}><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search or #hashtag" /><button>Search</button></form>
    </div>
    <section className="trending-section"><h3>Trending now</h3><div className="trending-list">{trending.slice(0, 5).map((post) => <button key={post._id} onClick={() => { setSearch(post.hashtags?.[0] || ''); setMode('all'); }}><span>{post.hashtags?.[0] || '#community'}</span><small>{post.likes || 0} likes · {post.comments?.length || 0} comments</small></button>)}</div></section>
    <form className="create-post-card" onSubmit={submitPost}><h3>Share an update</h3><textarea className="post-textarea" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share a project, achievement, or question. Use #hashtags and @mentions." maxLength="1000" /><div className="composer-options"><label>Image <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0] || null)} /></label><select value={language} onChange={(e) => setLanguage(e.target.value)}><option>javascript</option><option>python</option><option>java</option><option>html</option><option>css</option></select></div><textarea className="code-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Optional code snippet" /><div className="post-form-footer"><span className="char-count">{content.length}/1000</span><button className="btn btn-primary" disabled={loading || !content.trim()}>Publish</button></div></form>
    <div className="posts-feed">{posts.map((post) => <PostCard key={post._id} post={post} user={currentUser} onReact={react} onComment={comment} onReport={doReport} onFollow={toggleFollow} onDelete={async () => { if (window.confirm('Delete this post?')) { await deletePost(post._id, currentUser._id); setPosts((items) => items.filter((item) => item._id !== post._id)); } }} onEdit={async () => { const value = window.prompt('Edit your post', post.content); if (value?.trim()) { const { data } = await editPost(post._id, currentUser._id, { content: value.trim() }); updatePost(data); } }} />)}</div>
    {hasMore && <div ref={observerTarget} className="loading-spinner">{loading ? "Loading more posts…" : "Scroll to load more posts…"}</div>}
    {!loading && posts.length === 0 && <div className="no-posts"><h3>No posts found</h3><p>Try another search or be the first to share.</p></div>}
  </div>;
}

function PostCard({ post, user, onReact, onComment, onReport, onFollow, onEdit, onDelete }) {
  const [replyTo, setReplyTo] = useState(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const own = user && idOf(post.authorId) === user._id;
  const liked = post.likedBy?.some((id) => idOf(id) === user?._id);
  const saved = post.bookmarks?.some((id) => idOf(id) === user?._id);
  return <article className="post-card"><header className="post-header"><div className="post-author"><span className="author-avatar">{post.author?.[0]?.toUpperCase() || 'U'}</span><div><strong>{post.author}</strong><span className="post-date">{formatDate(post.createdAt)}</span></div></div><div>{own ? <><button onClick={onEdit}>Edit</button><button onClick={onDelete}>Delete</button></> : user && <><button onClick={() => onFollow(post)}>Follow</button><button onClick={() => onReport(post)}>Report</button></>}</div></header><div className="post-content"><p>{post.content}</p>{post.image && <img className="post-image" src={post.image} alt="Post attachment" />}{post.codeSnippet?.code && <pre><code>{post.codeSnippet.code}</code></pre>}{post.hashtags?.map((tag) => <span className="hashtag" key={tag}>{tag}</span>)}</div><div className="post-actions"><button className={liked ? 'liked' : ''} onClick={() => onReact(post, 'like')}>♥ {post.likes || 0}</button><button className={saved ? 'bookmarked' : ''} onClick={() => onReact(post, 'bookmark')}>Save</button><button onClick={() => onReact(post, 'share')}>Share {post.shares ? `(${post.shares})` : ''}</button><button onClick={() => setCommentsOpen((open) => !open)}>Comment {post.comments?.length ? `(${post.comments.length})` : ''}</button></div>{commentsOpen && <section className="comments-section">{post.comments?.map((comment) => <div className="comment" key={comment._id}><strong>{comment.user}</strong><p>{comment.text}</p>{comment.replies?.map((reply) => <div className="reply" key={reply._id}><strong>{reply.user}</strong> {reply.text}</div>)}<button className="btn-reply" onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}>Reply</button>{replyTo === comment._id && <CommentForm label="Reply" onSend={(text) => { onComment(post, text, comment._id); setReplyTo(null); }} />}</div>)}<CommentForm label="Comment" onSend={(text) => onComment(post, text)} /></section>}</article>;
}

function CommentForm({ label, onSend }) { const [text, setText] = useState(''); return <form className="comment-form" onSubmit={(e) => { e.preventDefault(); onSend(text); setText(''); }}><textarea rows="3" value={text} onChange={(e) => setText(e.target.value)} placeholder={`Write a ${label.toLowerCase()}…`} /><button>{label}</button></form>; }
export default Community;
