const DLAnnotations = (() => {
  const ANNOTATIONS = {
    identity: {
      type: 'identity', headline: 'Identity Matrix — No Transformation',
      dlConnection: 'Skip connections in ResNets keep an identity path so information can pass unchanged.',
      pytorch: 'y = x + F(x)  # residual + identity path'
    },
    rotation: {
      type: 'rotation', headline: 'Orthogonal Rotation Preserves Norms',
      dlConnection: 'Orthogonal weights preserve magnitudes and help stable gradients in deep and recurrent nets.',
      pytorch: 'nn.init.orthogonal_(layer.weight)'
    },
    singular: {
      type: 'singular', headline: 'Rank Collapse Loses Information',
      dlConnection: 'If rank drops, multiple inputs map to same output and information is unrecoverable.',
      pytorch: 'torch.linalg.matrix_rank(W)'
    },
    diagonal: {
      type: 'diagonal', headline: 'Axis-wise Scaling',
      dlConnection: 'Diagonal transforms model per-feature gain, similar to BatchNorm gamma parameters.',
      pytorch: 'y = gamma * x + beta'
    },
    shear: {
      type: 'shear', headline: 'Shear Mixes Features',
      dlConnection: 'Dense linear layers create feature mixing via off-diagonal terms.',
      pytorch: 'y = W @ x + b'
    },
    projection: {
      type: 'projection', headline: 'Projection Onto Subspace',
      dlConnection: 'Attention and embedding lookups are projections into learned subspaces.',
      pytorch: 'P = W @ W.T  # projection-like structure'
    },
    uniform_scale: {
      type: 'uniform_scale', headline: 'Uniform Scaling',
      dlConnection: 'Learning rate and weight decay often induce approximately uniform scaling dynamics.',
      pytorch: 'W = (1 - lr*wd) * W'
    },
    embeddings: {
      type: 'embeddings', headline: 'Word Embeddings as Vectors',
      dlConnection: 'Every word in an LLM\'s vocabulary is a vector. Linear combinations of word vectors encode semantic meaning geometrically.',
      pytorch: 'emb = nn.Embedding(vocab_size, dim)\nv = emb(torch.tensor([word_id]))  # returns a vector'
    },
    svd: {
      type: 'svd', headline: 'SVD Powers LoRA Fine-Tuning',
      dlConnection: 'LoRA (Low-Rank Adaptation) approximates weight updates ΔW ≈ BA where rank(BA) << rank(W). SVD shows why: most of ΔW\'s information lives in its top-k singular vectors.',
      pytorch: 'U, S, Vh = torch.linalg.svd(model.layer.weight)\nlow_rank = U[:, :r] @ torch.diag(S[:r]) @ Vh[:r, :]'
    },
    lora: {
      type: 'lora', headline: 'LoRA: Low-Rank Adaptation of LLMs',
      dlConnection: 'Instead of updating full W (d×k parameters), LoRA adds B·A where B is d×r and A is r×k, with r << min(d,k). SVD shows the mathematical justification.',
      pytorch: '# LoRA forward pass\nW_delta = lora_B @ lora_A  # rank-r approximation\ny = (W + alpha * W_delta) @ x'
    },
    pca: {
      type: 'pca', headline: 'PCA: Eigendecomposition of Data',
      dlConnection: 'PCA finds the eigenvectors of the data covariance matrix — the directions of maximum variance. Used for dimensionality reduction and feature analysis.',
      pytorch: 'X_centered = X - X.mean(0)\nU, S, V = torch.linalg.svd(X_centered)\npc1 = X_centered @ V[0]  # project onto first principal component'
    },
    spectral_radius: {
      type: 'spectral_radius', headline: 'RNN Stability via Spectral Radius',
      dlConnection: 'In RNNs, h_t = tanh(W·h_{t-1} + ...). If the largest eigenvalue |λ| > 1, gradients explode. If |λ| << 1, gradients vanish. Training stability requires spectral radius ≈ 1.',
      pytorch: 'eigenvalues = torch.linalg.eigvals(rnn.weight_hh_l0)\nspectral_radius = eigenvalues.abs().max()'
    },
    jacobian_logdet: {
      type: 'jacobian_logdet', headline: 'Normalizing Flows: log|det J|',
      dlConnection: 'Normalizing flows learn invertible transformations. The log-likelihood includes log|det J| — the log absolute determinant of the Jacobian. det measures volume change.',
      pytorch: 'log_det = torch.slogdet(jacobian)[1]  # numerically stable\nloss = -log_prob - log_det  # NF training objective'
    },
    weight_init: {
      type: 'weight_init', headline: 'Orthogonal Weight Initialization',
      dlConnection: 'Initializing weights as orthogonal matrices (det=±1, all eigenvalues on unit circle) preserves gradient norms at initialization — preventing vanishing/exploding gradients.',
      pytorch: 'nn.init.orthogonal_(layer.weight)  # U from SVD of random matrix'
    },
    orthogonal_reflect: {
      type: 'orthogonal_reflect', headline: 'Householder Reflection',
      dlConnection: 'Householder matrices are core building blocks in QR/SVD routines and orthogonal transforms.',
      pytorch: 'H = I - 2 * torch.outer(v, v)'
    },
    determinant: {
      type: 'determinant', headline: 'Determinant Tracks Volume Change',
      dlConnection: 'The Jacobian determinant in density modeling is a local volume-change factor.',
      pytorch: 'sign, logabsdet = torch.slogdet(J)'
    }
  };

  function get(type) {
    return ANNOTATIONS[type] || ANNOTATIONS.identity;
  }

  function classify(M, eigenResult) {
    const det = MathCore.det2(M);
    if (Math.abs(det) < 1e-8) return ANNOTATIONS.singular;
    if (MathCore.approx(M[0][1], 0, 1e-4) && MathCore.approx(M[1][0], 0, 1e-4)) {
      if (MathCore.approx(M[0][0], M[1][1], 1e-4)) return ANNOTATIONS.uniform_scale;
      return ANNOTATIONS.diagonal;
    }
    if (eigenResult && eigenResult.complex) return ANNOTATIONS.rotation;
    if (MathCore.approx(det, 1, 1e-3) && (Math.abs(M[0][1]) > 1e-4 || Math.abs(M[1][0]) > 1e-4)) return ANNOTATIONS.shear;
    return ANNOTATIONS.shear;
  }

  return { get, classify, ANNOTATIONS };
})();
window.DLAnnotations = DLAnnotations;
